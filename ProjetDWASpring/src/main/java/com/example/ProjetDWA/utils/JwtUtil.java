package com.example.ProjetDWA.utils;


import com.example.ProjetDWA.entities.Player;
import com.example.ProjetDWA.repositories.PlayerRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.*;
import java.util.function.Function;

@Component
@RequiredArgsConstructor
public class JwtUtil {

    private final PlayerRepository playerRepository;

    @Value("${jwt.secret}")
    private String secretKey;;

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    private String generateToken(Map<String, Objects> extraClaims, UserDetails userDetails) {
        return Jwts.builder().setClaims(extraClaims).setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256).compact();
    }

    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public Boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUserName(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolvers) {
        final Claims claims = extractAllClaims(token);
        return claimsResolvers.apply(claims);
    }

    private SecretKey convertToSecretKey(String secret) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);

        if (keyBytes.length < 32) {
            keyBytes = Arrays.copyOf(keyBytes, 32);
        }

        return new SecretKeySpec(keyBytes, "HmacSHA256");
    }

    public static SecretKey convertToSecretKey(Key key) {
        if (key.getAlgorithm().equalsIgnoreCase("AES") || key.getAlgorithm().equalsIgnoreCase("DES")) {
                return new SecretKeySpec(key.getEncoded(), key.getAlgorithm());
        } else {
                throw new IllegalArgumentException("The provided key is not compatible with SecretKey");
        }
    }


    private Claims extractAllClaims(String token) {
        //deprecated ?
        //return Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody();
        //return Jwts.parser().verifyWith(convertToSecretKey(getSigningKey())).build().parseSignedClaims(token).getBody();
        return Jwts.parser().verifyWith((SecretKey) getSigningKey()).build().parseSignedClaims(token).getPayload();
    }


    public String extractUserName(String token) {
        return extractClaim(token, Claims::getSubject);
    }


    public Player getLoggedInUser(){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Player player = (Player) authentication.getPrincipal();
            Optional<Player> optionalUser = playerRepository.findFirstByNickname(player.getNickname());
            return optionalUser.orElse(null);
        }
        return null;
    }

    public String extractNicknameFromToken(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("nickname", String.class);
    }
}
