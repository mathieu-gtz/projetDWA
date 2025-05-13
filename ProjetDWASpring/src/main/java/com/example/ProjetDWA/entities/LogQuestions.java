package com.example.ProjetDWA.entities;

import com.example.ProjetDWA.dto.LogQuestionsDto;
import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;


@Entity
@Getter
@Setter
@Table(name = "LogQuestions")
public class LogQuestions {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idQ;

    @OneToOne
    @JoinColumn(name = "nickname", referencedColumnName = "nickname")
    private Player nickname;

    @OneToOne
    @JoinColumn(name = "idG", referencedColumnName = "idG")
    private Game idG;

    private String contentQ;

    public LogQuestionsDto getLogQuestionsDto() {
        LogQuestionsDto logQuestionsDto = new LogQuestionsDto();
        logQuestionsDto.setIdQ(this.idQ);
        logQuestionsDto.setNickname(this.nickname);
        logQuestionsDto.setIdG(this.idG);
        logQuestionsDto.setContentQ(this.contentQ);

        return logQuestionsDto;
    }
}
