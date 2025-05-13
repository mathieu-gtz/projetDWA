package com.example.ProjetDWA.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Data
public class CharacDto {

    private Long idC;

    private String name;

    private String caracteristic;

    private String imagePath;

    private Set<Long> grids;

}
