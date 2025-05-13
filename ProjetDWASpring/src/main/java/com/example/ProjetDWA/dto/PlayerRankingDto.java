package com.example.ProjetDWA.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PlayerRankingDto {
    private String nickname;
    private int victories;
    private boolean online;
    private int rank;
}
