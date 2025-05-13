package com.example.ProjetDWA.utils;

import com.example.ProjetDWA.entities.Player;
import com.example.ProjetDWA.config.CustomUserDetails;

public class CustomUserDetailsMapper {

    public static CustomUserDetails toCustomUserDetails(Player player) {
        return new CustomUserDetails(player.getNickname(), player.getPswrd());
    }
}
