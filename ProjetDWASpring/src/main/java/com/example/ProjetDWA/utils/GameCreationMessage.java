package com.example.ProjetDWA.utils;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GameCreationMessage {
    private Long gameId;
    private String player1Nickname;
    private Long gridId;
    private String status; // "CREATED", "JOINED", "STARTED" ?

    @Override
    public String toString() {
        return "GameCreationMessage{" +
                "gameId=" + gameId +
                ", player1Nickname='" + player1Nickname + '\'' +
                ", gridId=" + gridId +
                ", status='" + status + '\'' +
                '}';
    }
}
