package com.example.ProjetDWA.services;

import com.example.ProjetDWA.dto.*;
import com.example.ProjetDWA.entities.Game;
import com.example.ProjetDWA.entities.Player;
import com.example.ProjetDWA.repositories.GridRepository;
import com.example.ProjetDWA.repositories.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import com.example.ProjetDWA.entities.Grid;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlayerService{

    private final PlayerRepository playerRepository;
    private final GridRepository gridRepository;
    private Set<String> onlinePlayers = ConcurrentHashMap.newKeySet();
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private final PasswordEncoder passwordEncoder;

    public UserDetailsService userDetailsService() {
        return username -> {
            try {
                Player player = playerRepository.findFirstByNickname(username)
                        .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé: " + username));

                return new User(player.getNickname(), player.getPswrd(), Collections.emptyList());
            } catch (Exception e) {
                System.err.println("Erreur lors du chargement de l'utilisateur: " + e.getMessage());
                throw e;
            }
        };
    }

    /*public UserDetailsService userDetailsService() {
        return new UserDetailsService() {

            @Override
            public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
                return (UserDetails) playerRepository.findFirstByNickname(username).orElseThrow(()->new UsernameNotFoundException("User not found"));
            }
        };
    }*/
    public List<PlayerDto> getAllPlayers() {
        return playerRepository.findAll().stream()
                .map(Player::getPlayerDto)
                .collect(Collectors.toList());
    }

    public PlayerDto getPlayerByNickname(String nickname) {
        Player player = playerRepository.findById(nickname)
                .orElseThrow(() -> new RuntimeException("Player not found"));
        return player.getPlayerDto();
    }

    public PlayerDto createPlayer(PlayerDto playerDto) {
        Player player = new Player();
        player.setNickname(playerDto.getNickname());
        player.setPswrd(playerDto.getPswrd());
        player.setAge(playerDto.getAge());
        player.setGender(playerDto.getGender());
        playerRepository.save(player);
        return player.getPlayerDto();
    }

    public PlayerDto updatePlayer(String nickname, PlayerDto playerDto) {
        Player existingPlayer = playerRepository.findById(nickname)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        Set<Game> gamesAsPlayer1 = existingPlayer.getGamesAsPlayer1();
        Set<Game> gamesAsPlayer2 = existingPlayer.getGamesAsPlayer2();
        Set<Game> gamesWon = existingPlayer.getGamesWon();
        Set<Grid> grids = existingPlayer.getGrids();
        String password = playerDto.getPswrd();
        if (password == null || password.isEmpty() || password.equals("")) {
            password = existingPlayer.getPswrd();
        }

        existingPlayer.setNickname(playerDto.getNickname());
        existingPlayer.setPswrd(password);
        existingPlayer.setAge(playerDto.getAge());
        existingPlayer.setGender(playerDto.getGender());

        existingPlayer.setGamesAsPlayer1(gamesAsPlayer1);
        existingPlayer.setGamesAsPlayer2(gamesAsPlayer2);
        existingPlayer.setGamesWon(gamesWon);
        existingPlayer.setGrids(grids);

        if (!nickname.equals(playerDto.getNickname())) {
            for (Game game : gamesAsPlayer1) {
                game.setPlayer1(existingPlayer);
            }for (Game game : gamesAsPlayer2) {
                game.setPlayer2(existingPlayer);
            }for (Game game : gamesWon) {
                game.setWinner(existingPlayer);
            }
            for (Grid grid : grids) {
                grid.setPlayer(existingPlayer);
            }
        }
        Player updatedPlayer = playerRepository.save(existingPlayer);
        return updatedPlayer.getPlayerDto();
    }

    public void deletePlayer(String nickname) {
        Player player = playerRepository.findById(nickname)
                .orElseThrow(() -> new RuntimeException("Player not found"));
        playerRepository.delete(player);
    }

    public List<GridDto> getGridsByDefault() {
        try {
            List<Grid> defaultGrids = gridRepository.findByPlayerIsNull();

            return defaultGrids.stream()
                    .map(grid -> {
                        GridDto dto = new GridDto();
                        dto.setIdGrid(grid.getIdGrid());
                        dto.setNameGrid(grid.getNameGrid());
                        dto.setPlayer(null);
                        if (grid.getCharacs() != null) {
                            dto.setCharacs(grid.getCharacs().stream()
                                    .map(charac -> {
                                        CharacDto characDto = new CharacDto();
                                        characDto.setIdC(charac.getIdC());
                                        characDto.setName(charac.getName());
                                        return characDto;
                                    })
                                    .collect(Collectors.toList()));
                        } else {
                            dto.setCharacs(new ArrayList<>());
                        }

                        return dto;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Erreur dans getGridsByDefault: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public List<GridDto> getGridsByPlayerNickname(String nickname) {
        Player player = playerRepository.findFirstByNickname(nickname)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Player not found with nickname: " + nickname));

        List<Grid> playerGrids = new ArrayList<>(player.getGrids());

        return playerGrids.stream()
                .map(Grid::getGridDto)
                .collect(Collectors.toList());
    }

    public PlayerStatsDto getPlayerStats(String nickname) {
        Player player = playerRepository.findById(nickname)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        PlayerStatsDto stats = new PlayerStatsDto();
        stats.setPlayerNickname(player.getNickname());
        int gamesPlayed = player.getGamesAsPlayer1().size() + player.getGamesAsPlayer2().size();
        stats.setGamesPlayed(gamesPlayed);
        int gamesWon = player.getGamesWon().size();
        stats.setGamesWon(gamesWon);
        stats.setWinRate(gamesPlayed > 0 ? (double) gamesWon / gamesPlayed * 100 : 0);
        double totalScore = 0;
        int scoreCount = 0;
        for (Game game : player.getGamesAsPlayer1()) {
            if (game.getScore1() != 0) {
                totalScore += game.getScore1();
                scoreCount++;
            }
        }
        for (Game game : player.getGamesAsPlayer2()) {
            if (game.getScore2() != 0) {
                totalScore += game.getScore2();
                scoreCount++;
            }
        }
        stats.setAverageScore(scoreCount > 0 ? totalScore / scoreCount : 0);
        return stats;
    }

    public void changePassword(String nickname, String currentPassword, String newPassword) {
        Player player = playerRepository.findById(nickname)
                .orElseThrow(() -> new RuntimeException("Player not found"));
        boolean passwordMatches = false;
        try {
            passwordMatches = passwordEncoder.matches(currentPassword, player.getPswrd());
        } catch (Exception e) {
            System.err.println("Erreur de vérification du mot de passe crypté: " + e.getMessage());
        }
        if (!passwordMatches && currentPassword.equals(player.getPswrd())) {
            passwordMatches = true;
        }
        if (!passwordMatches) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Mot de passe actuel incorrect");
        }
        player.setPswrd(passwordEncoder.encode(newPassword));
        playerRepository.save(player);
    }

    public void playerConnected(String nickname) {
        if (nickname != null) {
            onlinePlayers.add(nickname);
        } else {
            System.err.println("Tentative de connexion avec un nickname null");
        }
    }

    public void playerDisconnected(String nickname) {
        onlinePlayers.remove(nickname);
        broadcastOnlinePlayers();
    }

    public Set<String> getOnlinePlayers() {
        return new HashSet<>(onlinePlayers);
    }

    private void broadcastOnlinePlayers() {
        Map<String, Object> message = new HashMap<>();
        message.put("type", "ONLINE_PLAYERS");
        message.put("players", new ArrayList<>(onlinePlayers));
        messagingTemplate.convertAndSend("/topic/players/online", message);
    }

    public List<PlayerRankingDto> getRankings() {
        List<Player> players = playerRepository.findAll();
        List<PlayerRankingDto> rankings = new ArrayList<>();

        for (Player player : players) {
            PlayerRankingDto rankingDto = new PlayerRankingDto();
            rankingDto.setNickname(player.getNickname());
            int gamesWon = player.getGamesWon().size();
            rankingDto.setVictories(gamesWon);
            rankingDto.setOnline(onlinePlayers.contains(player.getNickname()));
            rankingDto.setRank(0);
            rankings.add(rankingDto);
        }
        rankings.sort(Comparator.comparingInt(PlayerRankingDto::getVictories).reversed());

        for (int i = 0; i < rankings.size(); i++) {
            rankings.get(i).setRank(i + 1);
        }
        return rankings;
    }
}
