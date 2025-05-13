package com.example.ProjetDWA.services;

import com.example.ProjetDWA.config.CustomUserDetails;
import com.example.ProjetDWA.entities.Player;
import com.example.ProjetDWA.repositories.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private PlayerRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Player player = userRepository.findFirstByNickname(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        System.out.println("Authenticating user: " + username);
        return new CustomUserDetails(player.getNickname(), player.getPswrd());
    }
}
