import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Character } from '../../models/Grid';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-guess-dialog',
  templateUrl: './guess-dialog.component.html',
  styleUrl: './guess-dialog.component.css',
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule
  ],
  standalone: true
})

export class GuessDialogComponent {
    selectedCharacter: Character | null = null;

    constructor(
        public dialogRef: MatDialogRef<GuessDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { characters: Character[] }
    ) {}

    onCancel(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        this.dialogRef.close({ character: this.selectedCharacter });
    }
}