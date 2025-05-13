package com.example.ProjetDWA.services;

import com.example.ProjetDWA.dto.CharacDto;
import com.example.ProjetDWA.dto.GridDto;
import com.example.ProjetDWA.entities.Charac;
import com.example.ProjetDWA.entities.Grid;
import com.example.ProjetDWA.repositories.CharacRepository;
import com.example.ProjetDWA.repositories.GridRepository;
import com.example.ProjetDWA.repositories.PlayerRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GridService {

    private final GridRepository gridRepository;
    private final CharacRepository characRepository;
    private final PlayerRepository playerRepository;

    @Value("${file.upload-dir:uploads/images}")
    private String uploadDir;
    private final ResourceLoader resourceLoader;

    //initialisation des grilles par défaut (3 grilles de 24 personnages)
    @PostConstruct
    public void initDefaultGridsAndCharacters() {
        // Vérifier si les grilles par défaut existent déjà
        if (gridRepository.findByPlayerIsNull().isEmpty()) {
            createDefaultGridsAndCharacters();
        }
        initCharacImages();
    }

    private void createDefaultGridsAndCharacters() {
        // grille de personnages historiques
        createDefaultGrid(
                "Personnages Historiques",
                List.of(
                        "Napoléon Bonaparte", "Cléopâtre", "Albert Einstein", "Marie Curie",
                        "Jeanne d'Arc", "Alexandre le Grand", "Mahatma Gandhi", "Léonard de Vinci",
                        "Marie-Antoinette", "Nelson Mandela", "Catherine de Médicis", "Charles de Gaulle",
                        "Florence Nightingale", "Louis XIV", "Frida Kahlo", "Christophe Colomb",
                        "Rosa Parks", "Galilée", "Élisabeth Ire", "Mozart",
                        "Simone de Beauvoir", "Jules César", "Maria Montessori", "Winston Churchill"
                ),
                "Personnage Historique"
        );

        // grille de personnages fictifs
        createDefaultGrid(
                "Personnages Fictifs",
                List.of(
                        "Harry Potter", "Sherlock Holmes", "Hermione Granger", "Gandalf",
                        "Wonder Woman", "Don Quichotte", "Katniss Everdeen", "Luke Skywalker",
                        "Princesse Leia", "James Bond", "Alice au pays des merveilles", "Batman",
                        "Anna (La Reine des neiges)", "Aragorn", "Lara Croft", "Spider-Man",
                        "Arya Stark", "Capitaine Haddock", "Daenerys Targaryen", "Indiana Jones",
                        "Fantine (Les Misérables)", "Docteur Who", "Cruella d'Enfer", "Astérix"
                ),
                "Personnage Fictif"
        );

        // grille de personnages du jeu de base
        createDefaultGrid(
                "Personnages du Qui est-ce",
                List.of(
                        "Paul", "Marie", "Thomas", "Élodie",
                        "Lucas", "Sophie", "Antoine", "Émilie",
                        "Pierre", "Claire", "Hugo", "Chloé",
                        "Mathieu", "Camille", "Nicolas", "Julie",
                        "Julien", "Laura", "Alexandre", "Léa",
                        "Maxime", "Sarah", "David", "Charlotte"
                )
                ,
                "Personnage du Qui est-ce"
        );
    }

    //méthode pour associer une image aux personnages par défaut
    private void initCharacImages() {
        List<Charac> characs = characRepository.findAll();
        for (Charac charac : characs) {
            if (charac.getImagePath() == null || charac.getImagePath().isEmpty() || charac.getImagePath().equals("default.png")) {
                String imageName = "charac" + charac.getIdC() + ".png";
                Resource resource = resourceLoader.getResource("classpath:static/images/" + imageName);

                if (resource.exists()) {
                    charac.setImagePath(imageName);
                } else {
                    //image par défaut si l'image n'existe pas
                    charac.setImagePath("default.png");
                }

                characRepository.save(charac);
            }
        }
    }

    private void createDefaultGrid(String gridName, List<String> characterNames, String caracteristic) {
        Grid grid = new Grid();
        grid.setNameGrid(gridName);
        grid.setPlayer(null); // grille par défaut donc créée par personne
        grid = gridRepository.save(grid);

        Set<Charac> characters = new java.util.HashSet<>();

        for (String name : characterNames) {
            Charac character = characRepository.findCharacByName(name)
                    .orElseGet(() -> {
                        Charac newCharacter = new Charac();
                        newCharacter.setName(name);
                        newCharacter.setCaracteristic(caracteristic);
                        return characRepository.save(newCharacter);
                    });


            if (character.getGrids() == null) {
                character.setGrids(new java.util.HashSet<>());
            }
            character.getGrids().add(grid);
            characRepository.save(character);

            characters.add(character);
        }
        grid.setCharacs(characters);
        gridRepository.save(grid);
    }




    public List<GridDto> getAllGrids() {
        return gridRepository.findAll().stream()
                .map(Grid::getGridDto)
                .collect(Collectors.toList());
    }

    public GridDto getGridById(Long id) {
        Grid grid = gridRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Grid not found"));
        return grid.getGridDto();
    }

    private Charac convertToCharac(CharacDto characDto) {
        Charac charac = new Charac();
        charac.setIdC(characDto.getIdC());
        charac.setName(characDto.getName());

        return charac;
    }

    public GridDto createGrid(GridDto gridDto) {
        Grid grid = new Grid();
        grid.setNameGrid(gridDto.getNameGrid());
        if (gridDto.getPlayer() != null && !gridDto.getPlayer().isEmpty()) {
            grid.setPlayer(playerRepository.findByNickname(gridDto.getPlayer()));
        }
        //on sauvegarde la grille pour lui donner un id avant d'ajouter les personnages
        gridRepository.save(grid);
        Set<Charac> characters = new java.util.HashSet<>();
        for (CharacDto characDto : gridDto.getCharacs()) {
            Charac charac = characRepository.findById(characDto.getIdC())
                    .orElseThrow(() -> new RuntimeException("Personnage non trouvé avec l'ID: " + characDto.getIdC()));

            if (charac.getGrids() == null) {
                charac.setGrids(new java.util.HashSet<>());
            }
            charac.getGrids().add(grid);
            characRepository.save(charac);
            characters.add(charac);
        }
        grid.setCharacs(characters);
        grid = gridRepository.save(grid);

        return grid.getGridDto();
    }

    public GridDto updateGrid(Long id, GridDto gridDto) {
        Grid grid = gridRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Grid not found"));
        grid.setNameGrid(gridDto.getNameGrid());
        if (grid.getCharacs() != null) {
            for (Charac charac : grid.getCharacs()) {
                charac.getGrids().remove(grid);
                characRepository.save(charac);
            }
        }
        Set<Charac> characters = new java.util.HashSet<>();
        for (CharacDto characDto : gridDto.getCharacs()) {
            Charac charac = characRepository.findById(characDto.getIdC())
                    .orElseThrow(() -> new RuntimeException("Personnage non trouvé avec l'ID: " + characDto.getIdC()));

            if (charac.getGrids() == null) {
                charac.setGrids(new java.util.HashSet<>());
            }
            charac.getGrids().add(grid);
            characRepository.save(charac);
            characters.add(charac);
        }
        grid.setCharacs(characters);
        grid = gridRepository.save(grid);
        return grid.getGridDto();
    }

    public void deleteGrid(Long id) {
        Grid grid = gridRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Grid not found"));
        gridRepository.delete(grid);
    }
}
