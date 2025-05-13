package com.example.ProjetDWA.services;

import com.example.ProjetDWA.dto.LogQuestionsDto;
import com.example.ProjetDWA.entities.LogQuestions;
import com.example.ProjetDWA.repositories.LogQuestionsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LogQuestionsService {

    private final LogQuestionsRepository logQuestionsRepository;

    public List<LogQuestionsDto> getAllLogQuestions() {
        return logQuestionsRepository.findAll().stream()
                .map(LogQuestions::getLogQuestionsDto)
                .collect(Collectors.toList());
    }

    public LogQuestionsDto getLogQuestionsById(Long id) {
        LogQuestions logQuestions = logQuestionsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("LogQuestions not found"));
        return logQuestions.getLogQuestionsDto();
    }

    public LogQuestionsDto createLogQuestions(LogQuestionsDto logQuestionsDto) {
        LogQuestions logQuestions = new LogQuestions();
        logQuestions.setContentQ(logQuestionsDto.getContentQ());
        logQuestions.setIdQ(logQuestionsDto.getIdQ());
        logQuestions.setIdG(logQuestionsDto.getIdG());
        logQuestions.setNickname(logQuestionsDto.getNickname());
        logQuestionsRepository.save(logQuestions);
        return logQuestions.getLogQuestionsDto();
    }

    public LogQuestionsDto updateLogQuestions(Long id, LogQuestionsDto logQuestionsDto) {
        LogQuestions logQuestions = logQuestionsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("LogQuestions not found"));
        logQuestions.setContentQ(logQuestionsDto.getContentQ());
        logQuestions.setIdQ(logQuestionsDto.getIdQ());
        logQuestions.setIdG(logQuestionsDto.getIdG());
        logQuestions.setNickname(logQuestionsDto.getNickname());
        logQuestionsRepository.save(logQuestions);
        return logQuestions.getLogQuestionsDto();
    }

    public void deleteLogQuestions(Long id) {
        LogQuestions logQuestions = logQuestionsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("LogQuestions not found"));
        logQuestionsRepository.delete(logQuestions);
    }
}
