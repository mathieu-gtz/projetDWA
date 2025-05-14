import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GridService } from '../../services/grid.service';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { NgForOf, NgIf } from '@angular/common';
import {forkJoin, map} from 'rxjs';
import { CharacService } from '../../services/charac.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../../src/environments/environment.prod';

@Component({
  selector: 'app-grid-details',
  templateUrl: './grid-details.component.html',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  styleUrls: ['./grid-details.component.css']
})
export class GridDetailsComponent implements OnInit {
  grid: any;
  loading = true;
  gridId: number;
  characterImages: Map<number, string> = new Map();
  characters: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private gridService: GridService,
    private characService: CharacService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.gridId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.gridId) {
      this.loadGridDetails(this.gridId);
    }
    this.loadCharacters()
  }

  loadGridDetails(gridId: Number): void {
    this.gridService.getGridDetails(this.gridId).subscribe({
      next: (grid) => {
        this.grid = grid;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des détails de la grille', err);
        this.loading = false;
      }
    });
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
          console.log(`Received image path for character ${character.idC}:`, imagePath);
          return { id: character.idC, path: imagePath };
        })
      );
    });

    forkJoin(imageRequests).subscribe({
      next: (results) => {
        results.forEach(result => {
          // Clean the URL before storing it
          let cleanUrl = result.path;
          if (cleanUrl.includes('localhost:8080')) {
            cleanUrl = cleanUrl.replace('http://localhost:8080', environment.apiUrl);
          }
          console.log(`Storing clean URL for character ${result.id}:`, cleanUrl);
          this.characterImages.set(result.id, cleanUrl);
        });
        this.characters = [...this.characters];
      },
      error: (error) => {
        console.error('Erreur lors du chargement des images', error);
      }
    });
  }

  getCharacterImageUrl(character: any): string {
    const characterId = typeof character === 'object' ? character.idC : character;
    const imageUrl = this.characterImages.get(characterId);
    console.log(`Getting URL for character ${characterId}:`, imageUrl);
    return imageUrl || `${environment.apiUrl}/images/default.png`;
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    console.error('Image failed to load:', img.src);
    
    if (img.src.includes('localhost:8080')) {
      const cleanUrl = img.src.replace('http://localhost:8080', environment.apiUrl);
      console.log('Retrying with clean URL:', cleanUrl);
      img.src = cleanUrl;
    } else {
      console.log('Using default image');
      img.src = `${environment.apiUrl}/images/default.png`;
    }
  }
}
