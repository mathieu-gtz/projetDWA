package com.example.ProjetDWA.entities;

import com.example.ProjetDWA.dto.PlayerDto;
import com.example.ProjetDWA.utils.Gender;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@Table(name = "Player")
public class Player {

    @Id
    private String nickname;

    private String pswrd;

    private int age;

    private Gender gender;

    @OneToMany(mappedBy = "player", cascade = CascadeType.ALL)
    @JsonManagedReference("player-grids")
    private Set<Grid> grids = new HashSet<>();

    public PlayerDto getPlayerDto(){
        PlayerDto playerDto = new PlayerDto();
        playerDto.setNickname(this.nickname);
        playerDto.setPswrd(this.pswrd);
        playerDto.setAge(this.age);
        playerDto.setGender(this.gender);

        return playerDto;
    }

    @JsonBackReference("game-player1")
    @OneToMany(mappedBy = "player1")
    private Set<Game> gamesAsPlayer1 = new HashSet<>();

    @JsonBackReference("game-player2")
    @OneToMany(mappedBy = "player2")
    private Set<Game> gamesAsPlayer2 = new HashSet<>();

    @JsonBackReference("game-winner")
    @OneToMany(mappedBy = "winner")
    private Set<Game> gamesWon = new HashSet<>();

}
