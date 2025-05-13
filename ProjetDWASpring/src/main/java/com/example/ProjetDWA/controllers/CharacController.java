package com.example.ProjetDWA.controllers;

import com.example.ProjetDWA.dto.CharacDto;
import com.example.ProjetDWA.services.CharacService;
import com.example.ProjetDWA.services.FileStorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/characs")
@RequiredArgsConstructor
public class CharacController {

    private final CharacService characService;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<List<CharacDto>> getAllCharacs() {
        List<CharacDto> characs = characService.getAllCharacs();
        return ResponseEntity.ok(characs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CharacDto> getCharacById(@PathVariable Long id) {
        CharacDto charac = characService.getCharacById(id);
        return ResponseEntity.ok(charac);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CharacDto> createCharac(
            @RequestPart("charac") String characJson,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            CharacDto characDto = objectMapper.readValue(characJson, CharacDto.class);
            CharacDto createdCharac = characService.createCharac(characDto);

            if (image != null && !image.isEmpty()) {
                String imagePath = fileStorageService.storeFile(image, createdCharac.getIdC());
                createdCharac.setImagePath(imagePath);
                createdCharac = characService.updateCharac(createdCharac.getIdC(), createdCharac);
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(createdCharac);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<CharacDto> updateCharac(@PathVariable Long id, @RequestBody CharacDto characDto) {
        CharacDto updatedCharac = characService.updateCharac(id, characDto);
        return ResponseEntity.ok(updatedCharac);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCharac(@PathVariable Long id) {
        characService.deleteCharac(id);
        return ResponseEntity.noContent().build();
    }

    //méthode pour associer une image à un personnage vu qu'on avait deja la méthode pour créer le personnage sans
    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CharacDto> uploadImage(@PathVariable Long id, @RequestParam("image") MultipartFile image) {

        CharacDto charac = characService.getCharacById(id);

        if (charac.getImagePath() != null && !charac.getImagePath().isEmpty()) {
            fileStorageService.deleteFile(charac.getImagePath());
        }

        String fileName = fileStorageService.storeFile(image, id);

        charac.setImagePath(fileName);
        CharacDto updatedCharac = characService.updateCharac(id, charac);

        return ResponseEntity.ok(updatedCharac);
    }

    @GetMapping("/default/{id}")
    public ResponseEntity<Boolean> isDefaultCharac(@PathVariable Long id) {
        boolean isDefault = characService.isDefaultCharac(id);
        return ResponseEntity.ok(isDefault);
    }

    @GetMapping("/{id}/image-url")
    public ResponseEntity<String> getCharacImageUrl(@PathVariable Long id) {
        boolean isDefault = characService.isDefaultCharac(id);

        if (isDefault) {
            return ResponseEntity.ok("/images/charac" + id + ".png"); //images statiques, pour les persos par défaut
        } else {
            CharacDto charac = characService.getCharacById(id);//pour les persos créés par les joueurs
            if (charac.getImagePath() != null && !charac.getImagePath().isEmpty()) {
                return ResponseEntity.ok("/uploads/images/" + charac.getImagePath());
            } else {
                //image par défaut
                return ResponseEntity.ok("/images/default.png");
            }
        }
    }
}
