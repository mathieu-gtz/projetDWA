package com.example.ProjetDWA.controllers;

import com.example.ProjetDWA.dto.GameDto;
import com.example.ProjetDWA.dto.GameMessagesDto;
import com.example.ProjetDWA.entities.Game;
import com.example.ProjetDWA.services.PlayerService;
import com.example.ProjetDWA.utils.GameCreationMessage;
import com.example.ProjetDWA.services.GameService;
import com.example.ProjetDWA.utils.GameReadyMessage;
import com.example.ProjetDWA.utils.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
@RequiredArgsConstructor
public class GameWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(GameWebSocketController.class);

    private final GameService gameService;
    private final SimpMessagingTemplate messagingTemplate;
    private final Map<Long, Map<String, Boolean>> gameReadyStatus = new ConcurrentHashMap<>(); //pour stocker l'etat des joueurs dans la partie
    private final PlayerService playerService;

    @Autowired
    private JwtUtil jwtUtil;

    @MessageMapping("/games/create")
    @SendTo("/topic/games")
    public GameCreationMessage createGame(GameDto gameDto) {

        GameDto createdGame = gameService.createGame(gameDto);

        return new GameCreationMessage(
                createdGame.getIdG(),
                createdGame.getPlayer1(),
                createdGame.getGrid(),
                "CREATED"
        );
    }

    @MessageMapping("/games/{gameId}/join")
    public void joinGame(@DestinationVariable Long gameId, GameDto gameDto) {
        GameDto updatedGame = gameService.joinGame(gameId, gameDto.getPlayer2());

        // Send to specific game topic
        messagingTemplate.convertAndSend(
                "/topic/games/" + gameId + "/join",
                Map.of(
                        "gameId", gameId,
                        "player2", gameDto.getPlayer2(),
                        "status", "JOINED",
                        "event", "JOINED"
                )
        );

        // Send to general game topic
        messagingTemplate.convertAndSend(
                "/topic/games/" + gameId,
                Map.of(
                        "gameId", gameId,
                        "player2", gameDto.getPlayer2(),
                        "status", "JOINED",
                        "event", "JOINED"
                )
        );

        // Also update the game list
        messagingTemplate.convertAndSend("/topic/games",
                Map.of(
                        "gameId", gameId,
                        "player2Nickname", gameDto.getPlayer2(),
                        "status", "JOINED"
                )
        );
    }

    @MessageMapping("/games/ready")
    public void setReady(GameReadyMessage readyMessage) {
        Long gameId = readyMessage.getGameId();
        String player = readyMessage.getPlayerNickname();
        boolean isReady = readyMessage.isReady();

        System.out.println("Ready message received: " + readyMessage);

        // Mettre à jour le status
        gameReadyStatus.computeIfAbsent(gameId, k -> new ConcurrentHashMap<>())
                .put(player, isReady);

        // Envoyer la mise à jour individuelle
        messagingTemplate.convertAndSend(
                "/topic/games/" + gameId + "/ready",
                readyMessage
        );

        // Envoyer la mise à jour globale
        Map<String, Boolean> readyMap = gameReadyStatus.get(gameId);
        messagingTemplate.convertAndSend(
                "/topic/games/" + gameId + "/readystatus",
                readyMap
        );

        // Vérifier les conditions de démarrage
        GameDto game = gameService.getGameById(gameId);
        if (game.getPlayer1() != null && game.getPlayer2() != null) {
            boolean player1Ready = Boolean.TRUE.equals(readyMap.get(game.getPlayer1()));
            boolean player2Ready = Boolean.TRUE.equals(readyMap.get(game.getPlayer2()));

            System.out.println("Game " + gameId + " ready status:");
            System.out.println("Player1 (" + game.getPlayer1() + "): " + player1Ready);
            System.out.println("Player2 (" + game.getPlayer2() + "): " + player2Ready);

            if (player1Ready && player2Ready) {
                messagingTemplate.convertAndSend(
                        "/topic/games/" + gameId + "/start",
                        Map.of(
                                "gameId", gameId,
                                "status", "GAME_STARTED",
                                "event", "GAME_START"
                        )
                );
            }
        }
    }

    @MessageMapping("/games/readystatus")
    public void getReadyStatus(GameDto gameDto) {
        Long gameId = gameDto.getIdG();
        Map<String, Boolean> readyStatus = gameReadyStatus.getOrDefault(gameId, new ConcurrentHashMap<>());

        System.out.println("Ready status request for game " + gameId + ": " + readyStatus); // Debug log

        messagingTemplate.convertAndSend(
                "/topic/games/" + gameId + "/readystatus",
                readyStatus
        );
    }


    @MessageMapping("/games/{gameId}/chat")
    @SendTo("/topic/games/{gameId}/chat")
    public GameMessagesDto handleChatMessage(
            @DestinationVariable Long gameId,
            @Payload GameMessagesDto message
    ) {
        log.info("Chat message received for game {}: {}", gameId, message);
        return message;
    }

    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        StompHeaderAccessor headers = StompHeaderAccessor.wrap(event.getMessage());
        String nickname = this.extractNickname(headers.getFirstNativeHeader("Authorization"));
        playerService.playerConnected(nickname);
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor headers = StompHeaderAccessor.wrap(event.getMessage());
        String nickname = extractNickname(headers.getFirstNativeHeader("Authorization"));
        playerService.playerDisconnected(nickname);
    }

    private String extractNickname(String token) {
        if (token == null || token.isEmpty() || !token.startsWith("Bearer ")) {
            return null;
        }
        try {
            String jwt = token.substring(7);
            return jwtUtil.extractUserName(jwt);
        } catch (Exception e) {
            log.error("Erreur lors de l'extraction du nickname depuis le token JWT: {}", e.getMessage());
            return null;
        }
    }


}
