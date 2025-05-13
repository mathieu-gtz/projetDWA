package com.example.ProjetDWA.controllers;

import com.example.ProjetDWA.dto.AuthenticationRequest;
import com.example.ProjetDWA.dto.AuthenticationResponse;
import com.example.ProjetDWA.dto.SignupRequest;
import com.example.ProjetDWA.dto.PlayerDto;
import com.example.ProjetDWA.entities.Player;
import com.example.ProjetDWA.repositories.PlayerRepository;
import com.example.ProjetDWA.services.AuthService;
import com.example.ProjetDWA.services.PlayerService;
import com.example.ProjetDWA.utils.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    private final PlayerRepository playerRepository;

    private final JwtUtil jwtUtil;

    private final PlayerService playerService;

    private final AuthenticationManager authenticationManager;



    @PostMapping("/signup")
    public ResponseEntity<?> signupUser(@RequestBody SignupRequest signupRequest) {
        if (authService.hasUserWithNickname(signupRequest.getNickname()))
            return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE).body("User already exists with this nickname");

        PlayerDto createdUserDto = authService.signupUser(signupRequest);
        if (createdUserDto == null)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User not created..");

        return ResponseEntity.status(HttpStatus.CREATED).body(createdUserDto);
    }

    @PostMapping("/login")
    public AuthenticationResponse login(@RequestBody AuthenticationRequest authenticationRequest) {
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                    authenticationRequest.getNickname(),
                    authenticationRequest.getPswrd()));
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Incorrect nickname or password");
        }

        System.out.println("Authentication successful ");
        final UserDetails userDetails = playerService.userDetailsService().loadUserByUsername(authenticationRequest.getNickname());
        Optional<Player> optionalUser = playerRepository.findFirstByNickname(authenticationRequest.getNickname());
        final String jwtToken = jwtUtil.generateToken(userDetails);
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();

        if (optionalUser.isPresent()){
            authenticationResponse.setJwt(jwtToken);
            authenticationResponse.setNickname(optionalUser.get().getNickname());
        }

        return authenticationResponse;

    }
}
