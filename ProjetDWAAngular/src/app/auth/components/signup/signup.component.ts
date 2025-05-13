import { Component } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {MatError, MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {MatIcon} from '@angular/material/icon';
import {NgIf} from '@angular/common';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatOption, MatSelect } from '@angular/material/select';

@Component({
  selector: 'app-signup',
  imports: [
    MatCard,
    MatCardTitle,
    MatCardContent,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatIcon,
    MatInput,
    NgIf,
    MatIconButton,
    MatButton,
    MatError,
    MatSelect,
    MatOption
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {

  signupForm!: FormGroup;
  hidePassword = true;

  constructor(private fb: FormBuilder,
              private authService:AuthService,
              private snackbar:MatSnackBar,
              private router:Router
  ){
    this.signupForm = this.fb.group({
      nickname:[null,[Validators.required]],
      age:[null,[Validators.required, Validators.min(13), Validators.max(120)]],
      gender:[null,[Validators.required]],
      password:[null,[Validators.required]],
      confirmPassword:[null,[Validators.required]]
    })
  }

  togglePasswordVisibility(){
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(){
    console.log(this.signupForm.value);
    const password = this.signupForm.get('password')?.value;
    const confirmPassword = this.signupForm.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      this.snackbar.open('Passwords do not match', 'Close', {
        duration: 5000,
        panelClass: 'error-snackbar',
      });
      return;
    }
    const userData = {
      nickname: this.signupForm.get('nickname')?.value,
      age: this.signupForm.get('age')?.value,
      gender: this.signupForm.get('gender')?.value,
      pswrd: password  // renomme password en pswrd pour le backend parce que si je me souviens bien password est un mot protégé en SQL
    };

    this.authService.signup(userData).subscribe({
      next: (res: any) => {
        console.log('Réponse du serveur:', res);//pour debug parce que ma condition du if ne fonctionnait pas
        this.snackbar.open('Sign up successful', 'Close', { duration: 5000 });
        this.router.navigateByUrl('/login');
      },
      error: (error) => {
        console.error('Erreur d\'inscription:', error);
        if (error.status === 406) {
          this.snackbar.open('A user with this nickname already exist', 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar',
          });
        } else {
          this.snackbar.open('Error during the sign up', 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar',
          });
        }
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.signupForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }
}
