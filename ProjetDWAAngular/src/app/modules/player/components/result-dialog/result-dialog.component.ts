import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-result-dialog',
  templateUrl: './result-dialog.component.html',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule]
})
export class ResultDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title: string; content: string },
    public dialogRef: MatDialogRef<ResultDialogComponent>
  ) {
    dialogRef.disableClose = false;
  }
}