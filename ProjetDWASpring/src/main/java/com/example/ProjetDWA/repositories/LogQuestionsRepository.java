package com.example.ProjetDWA.repositories;

import com.example.ProjetDWA.entities.LogQuestions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LogQuestionsRepository extends JpaRepository<LogQuestions, Long> {
}
