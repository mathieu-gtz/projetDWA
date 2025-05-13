package com.example.ProjetDWA.services;

import com.example.ProjetDWA.dto.SignupRequest;
import com.example.ProjetDWA.dto.PlayerDto;
import com.example.ProjetDWA.entities.Player;
import com.example.ProjetDWA.repositories.PlayerRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService{

    private final PlayerRepository playerRepository;

    //au cas où on aurait besoin d'un admin -> il faudra aussi rajouter un role à Player
    /*@PostConstruct
    public void createAnAdminAccount() {
        Optional<Player> optionalPlayer = playerRepository.findByPlayerRole(PlayerRole.ADMIN);
        if (optionalPlayer.isEmpty()) {
            Player player = new Player();
            player.setNickname("admin");
            player.setPswrd(new BCryptPasswordEncoder().encode("admin"));
            player.setAge(0);
            player.setGender("M");
            player.setUserRole(PlayerRole.ADMIN);
            playerRepository.save(user);
            System.out.println("Admin account created successfully!");
        } else {
            System.out.println("Admin account already exists!");
        }
    }*/


    public PlayerDto signupUser(SignupRequest signupRequest) {
        Player player = new Player();
        player.setNickname(signupRequest.getNickname());
        player.setPswrd(new BCryptPasswordEncoder().encode(signupRequest.getPswrd()));
        player.setAge(signupRequest.getAge());
        player.setGender(signupRequest.getGender());
        //player.setPlayerRole(PlayerRole.PLAYER);  ->au cas ou on rajoute les roles
        Player createdPlayer = playerRepository.save(player);
        return createdPlayer.getPlayerDto();
    }


    public boolean hasUserWithNickname(String nickname) {
        return playerRepository.findFirstByNickname(nickname).isPresent();
    }
}
