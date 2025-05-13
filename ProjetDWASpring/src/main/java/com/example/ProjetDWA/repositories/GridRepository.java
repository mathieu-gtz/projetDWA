package com.example.ProjetDWA.repositories;

import com.example.ProjetDWA.entities.Grid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GridRepository extends JpaRepository<Grid, Long> {

    Optional<Grid> findFirstByIdGrid (Long idGrid);
    List<Grid> findAllByPlayerNickname(String nickname);
    List<Grid> findByPlayerIsNull(); // grilles par défaut
}
