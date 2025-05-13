package com.example.ProjetDWA.dto;

import lombok.Data;

@Data
public class GameRulesDto {
    private boolean useRandomSubgrid;
    private int subgridSize;
    private int maxQuestionsPerTurn;
    private int maxTurnsPerRound;
    private int maxRounds;
}