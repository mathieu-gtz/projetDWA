package com.example.ProjetDWA.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Data
public class GridDto {

    private Long idGrid;

    private String nameGrid;

    private List<CharacDto> characs;

    private String player;
}
