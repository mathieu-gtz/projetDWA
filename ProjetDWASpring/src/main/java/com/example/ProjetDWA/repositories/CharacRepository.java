package com.example.ProjetDWA.repositories;

import com.example.ProjetDWA.entities.Charac;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CharacRepository extends JpaRepository<Charac, Long> {

    Optional<Charac> findCharacByName(String name);
}
