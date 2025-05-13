package com.example.ProjetDWA.entities;

import com.example.ProjetDWA.dto.GameDto;
import com.example.ProjetDWA.dto.GameRulesDto;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "Game")
@Getter
@Setter
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idG;

    @JsonManagedReference("game-winner")
    @ManyToOne
    @JoinColumn(name = "winner_nickname", referencedColumnName = "nickname", nullable = true)
    private Player winner;

    @JsonManagedReference("game-player1")
    @ManyToOne
    @JoinColumn(name = "player1_nickname", referencedColumnName = "nickname")
    private Player player1;

    @JsonManagedReference("game-player2")
    @ManyToOne
    @JoinColumn(name = "player2_nickname", referencedColumnName = "nickname", nullable = true)
    private Player player2;

    private int score1 = 0;

    private int score2 = 0;

    @JsonManagedReference("game-grid")
    @ManyToOne
    @JoinColumn(name = "idGrid")
    private Grid grid;

    @Column(name = "game_rules", columnDefinition = "TEXT")
    private String gameRules;

    public GameDto getGameDto(){
        GameDto gameDto = new GameDto();
        gameDto.setIdG(this.idG);
        if (this.winner != null) {
            gameDto.setWinner(this.winner.getNickname());
        } else {
            gameDto.setWinner(null);
        }
        gameDto.setPlayer1(this.player1.getNickname());
        if (this.player2 != null) {
            gameDto.setPlayer2(this.player2.getNickname());
        } else {
            gameDto.setPlayer2(null);
        }

        gameDto.setScore1(this.score1);
        gameDto.setScore2(this.score2);
        gameDto.setGrid(this.grid.getIdGrid());

        if (this.gameRules != null && !this.gameRules.isEmpty()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                GameRulesDto rulesDto = mapper.readValue(this.gameRules, GameRulesDto.class);
                gameDto.setGameRules(rulesDto);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        return gameDto;
    }
}
