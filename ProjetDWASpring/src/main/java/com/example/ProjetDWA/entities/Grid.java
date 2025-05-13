package com.example.ProjetDWA.entities;

import com.example.ProjetDWA.dto.GridDto;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;


@Entity
@Getter
@Setter
@Table(name = "Grid")
public class Grid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idGrid;

    private String nameGrid;

    @JsonBackReference("player-grids")
    @ManyToOne
    @JoinColumn(name = "player_nickname")
    private Player player; //créateur de la grille, par defaut null ?

    @JsonManagedReference("grid-characs")
    @ManyToMany(mappedBy = "grids")
    private Set<Charac> characs;

    public GridDto getGridDto(){
        GridDto gridDto = new GridDto();
        gridDto.setIdGrid(this.idGrid);
        gridDto.setNameGrid(this.nameGrid);
        if (this.player == null) {
            gridDto.setPlayer(null);
        } else {
            gridDto.setPlayer(this.player.getNickname());
        }
        gridDto.setCharacs(this.characs.stream().map(Charac::getCharacDto).toList());
        return gridDto;
    }

    @JsonBackReference("game-grid")
    @OneToMany(mappedBy = "grid")
    private Set<Game> games;

}
