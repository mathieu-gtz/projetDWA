package com.example.ProjetDWA.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GameMessagesDto {
    private String type;
    private String content;
    private String sender;
    private Long gameId;
}