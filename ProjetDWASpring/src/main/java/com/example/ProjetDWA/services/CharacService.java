package com.example.ProjetDWA.services;

import com.example.ProjetDWA.dto.CharacDto;
import com.example.ProjetDWA.entities.Charac;
import com.example.ProjetDWA.repositories.CharacRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CharacService {

    private final CharacRepository characRepository;

    public List<CharacDto> getAllCharacs() {
        return characRepository.findAll().stream()
                .map(Charac::getCharacDto)
                .collect(Collectors.toList());
    }

    public CharacDto getCharacById(Long id) {
        Charac charac = characRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Charac not found"));
        return charac.getCharacDto();
    }

    public CharacDto createCharac(CharacDto characDto) {
        Charac charac = new Charac();
        charac.setName(characDto.getName());
        charac.setCaracteristic(characDto.getCaracteristic());
        charac.setImagePath(characDto.getImagePath());
        characRepository.save(charac);
        return charac.getCharacDto();
    }

    public CharacDto updateCharac(Long id, CharacDto characDto) {
        Charac charac = characRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Charac not found"));
        charac.setName(characDto.getName());
        charac.setCaracteristic(characDto.getCaracteristic());
        charac.setImagePath(characDto.getImagePath());
        characRepository.save(charac);
        return charac.getCharacDto();
    }

    public void deleteCharac(Long id) {
        Charac charac = characRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Charac not found"));
        characRepository.delete(charac);
    }

    //pour savoir si le personnage fait partie des persos par défaut
    public boolean isDefaultCharac(Long characId) {
        Charac charac = characRepository.findById(characId)
                .orElseThrow(() -> new RuntimeException("Personnage non trouvé"));

        //on vérifie si le personnage appartient à une grille par défaut (avec un joueur qui l'a créé = null)
        if (charac.getGrids() != null) {
            return charac.getGrids().stream()
                    .anyMatch(grid -> grid.getPlayer() == null);
        }

        return false;
    }
}
