import { Component, OnInit } from '@angular/core';
import { GridService } from '../../services/grid.service';
import { StorageService } from '../../../../auth/services/storage/storage.service';
import {NgForOf, NgIf} from '@angular/common';
import {MatCardModule,} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-grids',
  templateUrl: './grids.component.html',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    MatIconModule,
    MatCardModule,
    MatButton
  ],
  styleUrl: './grids.component.css'
})
export class GridsComponent implements OnInit{

  defaultGrids: any[] = [];
  playerGrids: any[] = [];
  loading: boolean = true;
  currentPlayer: any;

  constructor(private gridService: GridService,
              private router: Router,
              private dialog: MatDialog) {}

  ngOnInit(): void {
    this.currentPlayer = StorageService.getUser();
    this.loadGrids();
  }

  loadGrids(): void {
    this.loading = true;

    this.gridService.getDefaultGrids().subscribe({
      next: (grids) => {
        this.defaultGrids = grids;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des grilles par défaut', err);
        this.loading = false;
      }
    });

    this.gridService.getPlayerGrids(this.currentPlayer.nickname).subscribe({
      next: (grids) => {
        this.playerGrids = grids;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des grilles du joueur', err);
        this.loading = false;
      }
    });
  }

  openGridDetails(grid: any) {

    //juste pour ouvrir une nouvelle page
    this.router.navigate(['/player/grid-details', grid.idGrid]);

    // si jamais on veut ouvrir un dialogue au final
    // this.dialog.open(GridDetailsComponent, {
    //   width: '800px',
    //   data: { grid: grid }
    // });
  }

  createNewGrid() {
    this.router.navigate(['/player/create-grid']);
  }
}
