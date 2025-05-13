package com.example.ProjetDWA.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlayerStatsDto {
    private String playerNickname;
    private int gamesPlayed;
    private int gamesWon;
    private double winRate;
    private double averageScore;
}
