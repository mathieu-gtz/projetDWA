package com.example.ProjetDWA.dto;

import com.example.ProjetDWA.utils.Gender;
import lombok.Data;

@Data
public class SignupRequest {

    private String nickname;

    private String pswrd;

    private int age;

    private Gender gender;
}
