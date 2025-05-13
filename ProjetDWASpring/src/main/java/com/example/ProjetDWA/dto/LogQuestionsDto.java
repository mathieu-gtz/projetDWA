package com.example.ProjetDWA.dto;

import com.example.ProjetDWA.entities.Game;
import com.example.ProjetDWA.entities.Player;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
public class LogQuestionsDto {

    private Long idQ;

    private Player nickname;

    private Game idG;

    private String contentQ;
}
