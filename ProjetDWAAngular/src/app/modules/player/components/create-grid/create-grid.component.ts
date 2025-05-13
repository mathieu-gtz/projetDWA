import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import {Router, RouterModule} from '@angular/router';
import { GridService } from '../../services/grid.service';
import { CharacService } from '../../services/charac.service';
import { StorageService } from '../../../../auth/services/storage/storage.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {NgForOf, NgIf} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {forkJoin, map } from 'rxjs';


@Component({
  selector: 'app-create-grid',
  templateUrl: './create-grid.component.html',
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule,
    NgIf,
    NgForOf,
    MatButtonModule

  ],
  styleUrl: './create-grid.component.css'
})
export class CreateGridComponent implements OnInit {
  gridForm: FormGroup;
  characters: any[] = [];
  selectedCharacters: any[] = [];
  isSubmitting = false;
  showCharactersList = true;
  currentPlayer: any;
  characterImages: Map<number, string> = new Map();


  constructor(
    private fb: FormBuilder,
    private gridService: GridService,
    private characService: CharacService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.gridForm = this.fb.group({
      nameGrid: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit(): void {
    this.currentPlayer = StorageService.getUser();
    this.loadCharacters();
  }

  loadCharacters(): void {
    this.characService.getAllCharacs().subscribe({
      next: (data) => {
        this.characters = data;
        this.preloadCharacterImages();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des personnages', error);
        this.snackBar.open('Impossible de charger les personnages', 'Fermer', { duration: 3000 });
      }
    });
  }

  preloadCharacterImages(): void {
    const imageRequests = this.characters.map(character => {
      return this.characService.getCharacImageUrl(character.idC).pipe(
        map(imagePath => {
          return { id: character.idC, path: imagePath };
        })
      );
    });

    forkJoin(imageRequests).subscribe({
      next: (results) => {
        results.forEach(result => {
          this.characterImages.set(result.id, `http://localhost:8080${result.path}`);
        });
        this.characters = [...this.characters];
      },
      error: (error) => {
        console.error('Erreur lors du chargement des images', error);
      }
    });
  }

  toggleCharacterSelection(character: any): void {
    const index = this.selectedCharacters.findIndex(c => c.idC === character.idC);

    if (index === -1) {
      if (this.selectedCharacters.length < 24) {
        this.selectedCharacters.push(character);
      } else {
        this.snackBar.open('Maximum 24 personnages peuvent être sélectionnés', 'Fermer', { duration: 3000 });
      }
    } else {
      if (this.selectedCharacters.length > 9) {
        this.selectedCharacters.splice(index, 1);
      } else {
        this.snackBar.open('Minimum 9 personnages doivent être sélectionnés', 'Fermer', { duration: 3000 });
      }
    }
  }

  unselectCharacter(character: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const index = this.selectedCharacters.findIndex(c => c.idC === character.idC);
    if (index !== -1) {
      if (this.selectedCharacters.length > 9) {
        this.selectedCharacters.splice(index, 1);
      } else {
        this.snackBar.open('Minimum 9 personnages doivent être sélectionnés', 'Fermer', { duration: 3000 });
      }
    }
  }

  toggleCharacterList(): void {
    this.showCharactersList = !this.showCharactersList;
  }

  isSelected(character: any): boolean {
    return this.selectedCharacters.some(c => c.idC === character.idC);
  }

  onSubmit(): void {
    if (this.gridForm.valid && this.selectedCharacters.length >= 9) {
      this.isSubmitting = true;

      const gridData = {
        nameGrid: this.gridForm.get('nameGrid')?.value,
        characs: this.selectedCharacters,
        player: this.currentPlayer.nickname
      };

      this.gridService.createGrid(gridData).subscribe({
        next: (response) => {
          this.snackBar.open('Grille créée avec succès', 'Fermer', { duration: 3000 });
          this.isSubmitting = false;
          this.router.navigate(['/player/grids']);
        },
        error: (error) => {
          console.error('Erreur lors de la création de la grille', error);
          this.snackBar.open('Erreur lors de la création de la grille', 'Fermer', { duration: 3000 });
          this.isSubmitting = false;
        }
      });
    } else if (this.selectedCharacters.length < 9) {
      this.snackBar.open('Sélectionnez au moins 9 personnages', 'Fermer', { duration: 3000 });
    }
  }

  getCharacterImageUrl(character: any): string {
    const characterId = typeof character === 'object' ? character.idC : character;
    return this.characterImages.get(characterId) ||
      `http://localhost:8080/images/default.png`;
  }

  //méthode pas très opti qui fait crash l'appli
  /*
  getCharacterImageUrl(characterId: number): string {
    const baseUrl = 'http://localhost:8080';
    let  imgUrl : string;
    this.characService.getCharacImageUrl(characterId).subscribe({
      next: (response) => {
        imgUrl = response;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération de l\'URL de l\'image', error);
      }
    });
    return `${baseUrl}/${imgUrl}`;
  }*/

}
