package com.example.ProjetDWA.entities;

import com.example.ProjetDWA.dto.CharacDto;
import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "Charac")
@Getter
@Setter
public class Charac {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idC;

    private String name;

    private String caracteristic; //caractéristique principale du personnage, par exemple si c'est un personnage historique, un personnage de fiction, etc.

    private String imagePath; //chemin de l'image associée au personnage

    @ManyToMany
    @JoinTable(
            name = "Membership", //nom de la table de jointure entre Grid et Charac
            joinColumns = @JoinColumn(name = "idC"),
            inverseJoinColumns = @JoinColumn(name = "idGrid")
    )
    private Set<Grid> grids;

    public CharacDto getCharacDto(){
        CharacDto characDto = new CharacDto();
        characDto.setIdC(this.idC);
        characDto.setName(this.name);
        characDto.setCaracteristic(this.caracteristic);
        characDto.setImagePath(this.imagePath);
        //characDto.setGrids(this.grids.stream().map(Grid::getIdGrid).collect(Collectors.toSet()));

        if (this.grids != null) {
            characDto.setGrids(this.grids.stream().map(Grid::getIdGrid).collect(Collectors.toSet()));
        } else {
            characDto.setGrids(Set.of());
        }

        return characDto;
    }
}
