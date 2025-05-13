package com.example.ProjetDWA.services;

import com.example.ProjetDWA.dto.GameDto;
import com.example.ProjetDWA.dto.GameRulesDto;
import com.example.ProjetDWA.entities.Game;
import com.example.ProjetDWA.entities.Player;
import com.example.ProjetDWA.repositories.GameRepository;
import com.example.ProjetDWA.repositories.GridRepository;
import com.example.ProjetDWA.repositories.PlayerRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GameService {

    private final GameRepository gameRepository;
    private final PlayerRepository playerRepository;
    private final GridRepository gridRepository;

    public List<GameDto> getAllGames() {
        return gameRepository.findAll().stream()
                .map(Game::getGameDto)
                .collect(Collectors.toList());
    }

    public List<GameDto> getActiveGames() {
        return gameRepository.findAll().stream()
                .filter(game -> game.getWinner() == null)
                .map(Game::getGameDto)
                .collect(Collectors.toList());
    }

    public GameDto getGameById(Long id) {
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Game not found"));
        return game.getGameDto();
    }

    public GameDto createGame(GameDto gameDto) {
        Game game = new Game();
        game.setPlayer1(playerRepository.findFirstByNickname(gameDto.getPlayer1())
                .orElseThrow(() -> new RuntimeException("Player1 not found")));
        if (gameDto.getPlayer2() != null) {
            game.setPlayer2(playerRepository.findFirstByNickname(gameDto.getPlayer2())
                    .orElseThrow(() -> new RuntimeException("Player2 not found")));
        }
        game.setScore1(gameDto.getScore1());
        game.setScore2(gameDto.getScore2());
        game.setGrid(gridRepository.findFirstByIdGrid(gameDto.getGrid())
                .orElseThrow(() -> new RuntimeException("Grid not found")));


        if (gameDto.getGameRules() != null) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                String rulesJson = mapper.writeValueAsString(gameDto.getGameRules());
                game.setGameRules(rulesJson);
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else {
            // Set default rules
            GameRulesDto defaultRules = new GameRulesDto();
            defaultRules.setMaxRounds(10);
            defaultRules.setUseRandomSubgrid(false);
            defaultRules.setSubgridSize(24);
            defaultRules.setMaxQuestionsPerTurn(1);
            defaultRules.setMaxTurnsPerRound(5);

            try {
                ObjectMapper mapper = new ObjectMapper();
                String rulesJson = mapper.writeValueAsString(defaultRules);
                game.setGameRules(rulesJson);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        gameRepository.save(game);
        return game.getGameDto();
    }

    public GameDto updateGame(Long id, GameDto gameDto) {
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        game.setScore1(gameDto.getScore1());
        game.setScore2(gameDto.getScore2());

        game.setPlayer1(playerRepository.findFirstByNickname(gameDto.getPlayer1())
                .orElseThrow(() -> new RuntimeException("Player1 not found")));

        if (gameDto.getPlayer2() != null) {
            game.setPlayer2(playerRepository.findFirstByNickname(gameDto.getPlayer2())
                    .orElseThrow(() -> new RuntimeException("Player2 not found")));
        } else {
            game.setPlayer2(null);
        }

        if (gameDto.getWinner() != null) {
            game.setWinner(playerRepository.findFirstByNickname(gameDto.getWinner())
                    .orElseThrow(() -> new RuntimeException("Winner not found")));
        } else {
            game.setWinner(null);
        }
        game.setGrid(gridRepository.findFirstByIdGrid(gameDto.getGrid())
                .orElseThrow(() -> new RuntimeException("Grid not found")));

        if (gameDto.getGameRules() != null) {
            ObjectMapper objectMapper = new ObjectMapper();
            try {
                String gameRulesJson = objectMapper.writeValueAsString(gameDto.getGameRules());
                game.setGameRules(gameRulesJson);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        gameRepository.save(game);
        return game.getGameDto();
    }

    public void deleteGame(Long id) {
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Game not found"));
        gameRepository.delete(game);
    }

    public GameDto joinGame(Long id, String player2) {
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Game not found"));
        Player player = playerRepository.findFirstByNickname(player2)
                .orElseThrow(() -> new RuntimeException("Player not found"));
        game.setPlayer2(player);
        gameRepository.save(game);
        return game.getGameDto();
    }

    public GameDto endGame(Long gameId, String winnerNickname) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Partie non trouvée"));

        Player winner = playerRepository.findFirstByNickname(winnerNickname)
                .orElseThrow(() -> new RuntimeException("Joueur non trouvé"));

        if (!winner.getNickname().equals(game.getPlayer1().getNickname()) &&
                (game.getPlayer2() == null || !winner.getNickname().equals(game.getPlayer2().getNickname()))) {
            throw new RuntimeException("Le gagnant doit être l'un des joueurs de la partie");
        }

        game.setWinner(winner);
        gameRepository.save(game);

        return game.getGameDto();
    }


    public Game getGame(Long gameId) {
        return gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));
    }

    public Game saveGame(Game game) {
        return gameRepository.save(game);
    }

}
