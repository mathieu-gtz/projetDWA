import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StorageService } from '../../../../auth/services/storage/storage.service';
import { PlayerService } from '../../services/player.service';
import {Player} from '../../models/Player';
import {PlayerStats} from '../../models/PlayerStats';


@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent implements OnInit {
  currentPlayer: Player;
  playerStats: PlayerStats | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  loading = false;
  dataLoading = true;

  constructor(
    private fb: FormBuilder,
    private playerService: PlayerService,
    private snackBar: MatSnackBar
  ) {
    this.currentPlayer = StorageService.getUser();
    console.log(this.currentPlayer);

    this.profileForm = this.fb.group({
      age: [this.currentPlayer.age, [Validators.min(13), Validators.max(120)]],
      gender: [this.currentPlayer.gender]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.checkPasswords });
  }

  ngOnInit(): void {
    this.loadPlayerData();
    this.loadUserStats();
    this.initializeFormValues();
  }

  loadPlayerData(): void {
    this.dataLoading = true;
    this.playerService.getPlayerByNickname(this.currentPlayer.nickname).subscribe({
      next: (playerData) => {
        console.log('Données joueur récupérées:', playerData);
        this.currentPlayer = playerData;
        StorageService.saveUser(playerData);
        this.initializeFormValues();
        this.dataLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données du joueur:', error);
        this.snackBar.open('Impossible de charger les données du profil', 'Fermer', { duration: 3000 });
        this.dataLoading = false;
      }
    });
  }

  initializeFormValues(): void {
      this.profileForm.patchValue({
      age: this.currentPlayer.age,
      gender: this.currentPlayer.gender
    });
  }
  updateFormAfterPlayerChange(): void {
    if (this.currentPlayer) {
      this.initializeFormValues();
    }
  }

  loadUserStats(): void {
    this.loading = true;
    this.playerService.getUserStats(this.currentPlayer.nickname).subscribe({
      next: (stats) => {
        this.playerStats = stats;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques', error);
        this.snackBar.open('Impossible de charger vos statistiques', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;

    const updatedPlayer: Player = {
      nickname: this.currentPlayer.nickname,
      age: this.profileForm.get('age')?.value ?? this.currentPlayer.age,
      gender: this.profileForm.get('gender')?.value ?? this.currentPlayer.gender
    };

    this.loading = true;
    this.playerService.updateUser(updatedPlayer).subscribe({
      next: (user) => {
        this.currentPlayer = user;
        StorageService.saveUser(user);
        this.snackBar.open('Profil mis à jour avec succès', 'Fermer', { duration: 3000 });
        this.loading = false;
        this.updateFormAfterPlayerChange();
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du profil', error);
        this.snackBar.open('Erreur lors de la mise à jour du profil', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;

    this.loading = true;
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.playerService.changePassword(this.currentPlayer.nickname, currentPassword, newPassword).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.snackBar.open('Mot de passe changé avec succès', 'Fermer', { duration: 3000 });
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du changement de mot de passe', error);
        this.snackBar.open('Erreur lors du changement de mot de passe', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  checkPasswords(group: FormGroup) {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { notSame: true };
  }

  getGenderLabel(genderCode: string | undefined): string {
    if (!genderCode) return 'Non spécifié';

    switch (genderCode) {
      case 'M': return 'Homme';
      case 'F': return 'Femme';
      case 'O': return 'Autre';
      default: return 'Non spécifié';
    }
  }

}
