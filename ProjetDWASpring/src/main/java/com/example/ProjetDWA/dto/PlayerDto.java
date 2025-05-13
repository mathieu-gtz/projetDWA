package com.example.ProjetDWA.dto;


import com.example.ProjetDWA.utils.Gender;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;


@Data
public class PlayerDto {

    private String nickname;

    private String pswrd;

    private int age;

    private Gender gender;
}
