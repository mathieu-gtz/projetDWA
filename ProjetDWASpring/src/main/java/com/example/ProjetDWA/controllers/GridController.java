package com.example.ProjetDWA.controllers;

import com.example.ProjetDWA.dto.GridDto;
import com.example.ProjetDWA.services.GridService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grids")
@RequiredArgsConstructor
public class GridController {

    private final GridService gridService;

    @GetMapping
    public ResponseEntity<List<GridDto>> getAllGrids() {
        List<GridDto> grids = gridService.getAllGrids();
        return ResponseEntity.ok(grids);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GridDto> getGridById(@PathVariable Long id) {
        GridDto grid = gridService.getGridById(id);
        return ResponseEntity.ok(grid);
    }

    @PostMapping
    public ResponseEntity<GridDto> createGrid(@RequestBody GridDto gridDto) {
        GridDto createdGrid = gridService.createGrid(gridDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdGrid);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GridDto> updateGrid(@PathVariable Long id, @RequestBody GridDto gridDto) {
        GridDto updatedGrid = gridService.updateGrid(id, gridDto);
        return ResponseEntity.ok(updatedGrid);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGrid(@PathVariable Long id) {
        gridService.deleteGrid(id);
        return ResponseEntity.noContent().build();
    }
}
