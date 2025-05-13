package com.example.ProjetDWA.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
public class GameDto {

    private Long idG;

    private String winner;

    private String player1;

    private String player2;

    private int score1;

    private int score2;

    private Long grid;

    private GameRulesDto gameRules;


}
