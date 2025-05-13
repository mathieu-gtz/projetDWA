import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { GridService } from '../../services/grid.service';
import { GameService } from '../../services/game.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from '../../../../auth/services/storage/storage.service';

@Component({
  selector: 'app-create-game',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatCardModule,
    MatCheckboxModule,
    MatDividerModule
  ],
  templateUrl: './create-game.component.html',
  styleUrl: './create-game.component.css'
})
export class CreateGameComponent implements OnInit {
  gameForm: FormGroup;
  availableGrids: any[] = [];
  loading = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private gridService: GridService,
    private gameService: GameService,
    private snackBar: MatSnackBar,
    private storageService: StorageService
  ) {
    this.gameForm = this.fb.group({
      gridId: [null, Validators.required],
      useRandomSubgrid: [false],
      subgridSize: [24, [Validators.required, Validators.min(9), Validators.max(36)]],
      maxRounds: [10, [Validators.required, Validators.min(1)]],
      unlimitedRounds: [false],
      maxTurns: [5, [Validators.required, Validators.min(1)]],
      usePassword: [false],
      password: [''],
      allowSpectators: [true]
    });
  }

  ngOnInit() {

    this.loadAvailableGrids();

    this.gameForm.get('useRandomSubgrid')?.valueChanges.subscribe(useRandom => {
      const subgridSizeControl = this.gameForm.get('subgridSize');
      if (useRandom) {
        subgridSizeControl?.enable();
      } else {
        subgridSizeControl?.disable();
      }
    });

    this.gameForm.get('usePassword')?.valueChanges.subscribe(usePassword => {
      const passwordControl = this.gameForm.get('password');
      if (usePassword) {
        passwordControl?.setValidators([Validators.required, Validators.minLength(4)]);
      } else {
        passwordControl?.clearValidators();
        passwordControl?.setValue('');
      }
      passwordControl?.updateValueAndValidity();
    });

    this.gameForm.get('unlimitedRounds')?.valueChanges.subscribe(unlimited => {
      const maxRoundsControl = this.gameForm.get('maxRounds');
      if (unlimited) {
        maxRoundsControl?.disable();
      } else {
        maxRoundsControl?.enable();
      }
    });

    if (!this.gameForm.get('useRandomSubgrid')?.value) {
      this.gameForm.get('subgridSize')?.disable();
    }
  }

  loadAvailableGrids() {
    this.loading = true;
    this.gridService.getAvailableGrids().subscribe({
      next: (grids) => {
        this.availableGrids = grids;
        if (grids.length > 0) {
          this.gameForm.get('gridId')?.setValue(grids[0].id);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des grilles', error);
        this.snackBar.open('Erreur lors du chargement des grilles disponibles', 'Fermer', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (this.gameForm.valid) {
      const gameRules = {
        useRandomSubgrid: this.gameForm.get('useRandomSubgrid')?.value,
        subgridSize: this.gameForm.get('subgridSize')?.value,
        // On utitlise -1 pour l'infini
        maxRounds: this.gameForm.get('unlimitedRounds')?.value ? -1 : this.gameForm.get('maxRounds')?.value,
        maxQuestionsPerTurn: 1,
        maxTurnsPerRound: this.gameForm.get('maxTurns')?.value
      };

      const gameData = {
        winner: null,
        player1: StorageService.getUser().nickname,
        player2: null,
        score1: 0,
        score2: 0,
        grid: this.gameForm.get('gridId')?.value,
        gameRules: gameRules 
      };
      
      this.gameService.createGame(gameData).subscribe({
        next: (response) => {
          console.log('Game created with response:', response);
          this.snackBar.open('Partie créée avec succès', 'Fermer', {
            duration: 3000
          });
          this.router.navigate(['/player/lobby', response.idG]);
        },
        error: (error) => {
          console.error('Error creating game:', error);
          this.snackBar.open('Erreur lors de la création de la partie', 'Fermer', {
            duration: 3000
          });
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/player/home']);
  }


  elementCount(grid?: any): number {
    if (grid && grid.characters) {
      return grid.characters.length;
    }

    const selectedGridId = this.gameForm.get('gridId')?.value;
    const selectedGrid = this.availableGrids.find(g => g.idGrid === selectedGridId);

    if (selectedGrid && selectedGrid.characters) {
      return selectedGrid.characters.length;
    }

    //un peu bancale ma fonction donc je mets un retour par défaut pour le moment
    return 24;
  }
}
