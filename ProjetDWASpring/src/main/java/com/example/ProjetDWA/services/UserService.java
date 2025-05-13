package com.example.ProjetDWA.services;

import com.example.ProjetDWA.repositories.PlayerRepository;
import com.example.ProjetDWA.utils.CustomUserDetailsMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService{

    private final PlayerRepository userRepository;


    public UserDetailsService userDetailsService() {
        return new UserDetailsService() {
            @Override
            public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
                return CustomUserDetailsMapper.toCustomUserDetails(userRepository.findFirstByNickname(username).orElseThrow(()->new UsernameNotFoundException("User not found")));
            }
        };
    }
}
