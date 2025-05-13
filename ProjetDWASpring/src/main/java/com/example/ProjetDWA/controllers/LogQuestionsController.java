package com.example.ProjetDWA.controllers;

import com.example.ProjetDWA.dto.LogQuestionsDto;
import com.example.ProjetDWA.services.LogQuestionsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/log-questions")
@RequiredArgsConstructor
public class LogQuestionsController {

    private final LogQuestionsService logQuestionsService;

    @GetMapping
    public ResponseEntity<List<LogQuestionsDto>> getAllLogQuestions() {
        return ResponseEntity.ok(logQuestionsService.getAllLogQuestions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LogQuestionsDto> getLogQuestionsById(@PathVariable Long id) {
        return ResponseEntity.ok(logQuestionsService.getLogQuestionsById(id));
    }

    @PostMapping
    public ResponseEntity<LogQuestionsDto> createLogQuestions(@RequestBody LogQuestionsDto logQuestionsDto) {
        return ResponseEntity.ok(logQuestionsService.createLogQuestions(logQuestionsDto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LogQuestionsDto> updateLogQuestions(@PathVariable Long id, @RequestBody LogQuestionsDto logQuestionsDto) {
        return ResponseEntity.ok(logQuestionsService.updateLogQuestions(id, logQuestionsDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLogQuestions(@PathVariable Long id) {
        logQuestionsService.deleteLogQuestions(id);
        return ResponseEntity.noContent().build();
    }
}
