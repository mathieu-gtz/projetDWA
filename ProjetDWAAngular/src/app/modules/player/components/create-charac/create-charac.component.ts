import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { StorageService } from '../../../../auth/services/storage/storage.service';
import { CharacService } from '../../services/charac.service';

@Component({
  selector: 'app-create-charac',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './create-charac.component.html',
  styleUrl: './create-charac.component.css'
})
export class CreateCharacComponent implements OnInit {
  characForm: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private router: Router,
    private characService: CharacService,
  ) {
    this.characForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      caracteristic: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      image: [null, Validators.required]
    });
  }

  ngOnInit(): void {
  }

  onFileSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      console.log('Type de fichier :', this.selectedFile instanceof File);
      console.log('Objet fichier :', this.selectedFile);

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);

      this.characForm.patchValue({
        image: this.selectedFile.name
      });
      this.characForm.get('image')?.markAsTouched();
    }
  }

  onSubmit(): void {
    if (this.characForm.valid && this.selectedFile) {
      this.isSubmitting = true;
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${StorageService.getToken()}`,
      });

      const formData = new FormData();
      const characData = {
        name: this.characForm.get('name')?.value,
        caracteristic: this.characForm.get('caracteristic')?.value
      };

      const imageFile = this.selectedFile;
      const token = StorageService.getToken();

      this.characService.createCharac(characData, imageFile).subscribe({
        next: (response) => {
          this.snackBar.open('Personnage créé avec succès', 'Fermer', { duration: 3000 });
          this.isSubmitting = false;
          this.characForm.reset();
          this.previewUrl = null;
          this.selectedFile = null;
          Object.keys(this.characForm.controls).forEach(key => {
            this.characForm.get(key)?.markAsUntouched();
          });
          this.router.navigate(['/player/create-charac']); //si on a le temps de créer le composant qui affiche la liste des personnages il faudrat le rediriger ici
        },
        error: (error) => {
          console.error('Erreur lors de la création du personnage', error);
          this.snackBar.open('Erreur lors de la création du personnage', 'Fermer', { duration: 3000 });
          this.isSubmitting = false;
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/player/home']);
  }

  isImageRequiredAndTouched(): boolean {
    const imageControl = this.characForm.get('image');
    return !!imageControl && imageControl.hasError('required') && imageControl.touched;
  }
}
