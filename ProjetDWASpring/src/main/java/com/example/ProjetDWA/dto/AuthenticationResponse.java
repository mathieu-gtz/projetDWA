package com.example.ProjetDWA.dto;

import lombok.Data;

@Data
public class AuthenticationResponse {

    private String jwt;

    private String nickname;

}
