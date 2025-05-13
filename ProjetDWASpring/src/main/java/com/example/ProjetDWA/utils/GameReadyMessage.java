package com.example.ProjetDWA.utils;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GameReadyMessage {
    private Long gameId;
    private String playerNickname;
    private boolean ready;
    private String event;
    private String type;

    public GameReadyMessage(Long gameId, String playerNickname, boolean ready, String event) {
        this.gameId = gameId;
        this.playerNickname = playerNickname;
        this.ready = ready;
        this.event = event;
        this.type = event; // Pour la compatibilité avec le front
    }
}
