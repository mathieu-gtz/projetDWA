package com.example.ProjetDWA.controllers;

import com.example.ProjetDWA.dto.GridDto;
import com.example.ProjetDWA.dto.PlayerDto;
import com.example.ProjetDWA.dto.PlayerRankingDto;
import com.example.ProjetDWA.dto.PlayerStatsDto;
import com.example.ProjetDWA.services.PlayerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerService playerService;

    @GetMapping
    public ResponseEntity<List<PlayerDto>> getAllPlayers() {
        List<PlayerDto> players = playerService.getAllPlayers();
        return ResponseEntity.ok(players);
    }

    @GetMapping("/{nickname}")
    public ResponseEntity<PlayerDto> getPlayerByNickname(@PathVariable String nickname) {
        PlayerDto player = playerService.getPlayerByNickname(nickname);
        return ResponseEntity.ok(player);
    }

    @PostMapping
    public ResponseEntity<PlayerDto> createPlayer(@RequestBody PlayerDto playerDto) {
        PlayerDto createdPlayer = playerService.createPlayer(playerDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPlayer);
    }

    @PutMapping("/{nickname}")
    public ResponseEntity<PlayerDto> updatePlayer(@PathVariable String nickname, @RequestBody PlayerDto playerDto) {
        PlayerDto updatedPlayer = playerService.updatePlayer(nickname, playerDto);
        return ResponseEntity.ok(updatedPlayer);
    }

    @DeleteMapping("/{nickname}")
    public ResponseEntity<Void> deletePlayer(@PathVariable String nickname) {
        playerService.deletePlayer(nickname);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{nickname}/grids")
    public ResponseEntity<List<GridDto>> getPlayerGrids(@PathVariable String nickname) {
        List<GridDto> grids = playerService.getGridsByPlayerNickname(nickname);
        return ResponseEntity.ok(grids);
    }
    @GetMapping("/grids/default")
    public ResponseEntity<List<GridDto>> getDefaultGrids() {
        List<GridDto> grids = playerService.getGridsByDefault();
        return ResponseEntity.ok(grids);
    }


    @GetMapping("/{nickname}/stats")
    public ResponseEntity<PlayerStatsDto> getPlayerStats(@PathVariable String nickname) {
        try {
            PlayerStatsDto stats = playerService.getPlayerStats(nickname);
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{nickname}/change-password")
    public ResponseEntity<Void> changePassword(@PathVariable String nickname,  @RequestBody Map<String, String> passwordData) {
        try {
            String currentPassword = passwordData.get("currentPassword");
            String newPassword = passwordData.get("newPassword");

            if (currentPassword == null || newPassword == null) {
                return ResponseEntity.badRequest().build();
            }

            playerService.changePassword(nickname, currentPassword, newPassword);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @GetMapping("/rankings")
    public ResponseEntity<List<PlayerRankingDto>> getRankings() {
        List<PlayerRankingDto> rankings = playerService.getRankings();
        return ResponseEntity.ok(rankings);
    }
}
