package com.example.ProjetDWA.controllers;

import com.example.ProjetDWA.dto.GameDto;
import com.example.ProjetDWA.dto.GameRulesDto;
import com.example.ProjetDWA.entities.Game;
import com.example.ProjetDWA.services.GameService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;

    @GetMapping
    public ResponseEntity<List<GameDto>> getAllGames() {
        return ResponseEntity.ok(gameService.getAllGames());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GameDto> getGameById(@PathVariable Long id) {
        return ResponseEntity.ok(gameService.getGameById(id));
    }

    @GetMapping("/active")
    public ResponseEntity<List<GameDto>> getActiveGames() {
        return ResponseEntity.ok(gameService.getActiveGames());
    }

    @PostMapping
    public ResponseEntity<GameDto> createGame(@RequestBody GameDto gameDto) {
        return ResponseEntity.ok(gameService.createGame(gameDto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GameDto> updateGame(@PathVariable Long id, @RequestBody GameDto gameDto) {
        return ResponseEntity.ok(gameService.updateGame(id, gameDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGame(@PathVariable Long id) {
        gameService.deleteGame(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{gameId}/score")
    public ResponseEntity<GameDto> updateScore(
                                                 @PathVariable Long gameId,
                                                 @RequestBody Map<String, Boolean> body) {

        Boolean pointForPlayer1 = body.get("pointForPlayer1");
        if (pointForPlayer1 == null) {
            return ResponseEntity.badRequest().build();
        }

        Game game = gameService.getGame(gameId);
        if (game == null) {
            return ResponseEntity.notFound().build();
        }

        if (pointForPlayer1) {
            game.setScore1(game.getScore1() + 1);
        } else {
            game.setScore2(game.getScore2() + 1);
        }

        game = gameService.saveGame(game);
        return ResponseEntity.ok(game.getGameDto());  // Return DTO instead of entity
    }

    @PutMapping("/{gameId}/rules")
    public ResponseEntity<GameDto> updateGameRules(
            @PathVariable Long gameId,
            @RequestBody GameRulesDto rules) {
        try {
            Game game = gameService.getGame(gameId);
            ObjectMapper mapper = new ObjectMapper();
            String rulesJson = mapper.writeValueAsString(rules);
            game.setGameRules(rulesJson);
            game = gameService.saveGame(game);
            return ResponseEntity.ok(game.getGameDto());
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

}
