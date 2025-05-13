package com.example.ProjetDWA.repositories;

import com.example.ProjetDWA.entities.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlayerRepository extends JpaRepository<Player, String> {
    Optional<Player> findFirstByNickname(String nickname);

    Player findByNickname(String player);
}
