import { Component } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from '../../services/storage/storage.service';
import {Router, RouterLink} from '@angular/router';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [
    MatCardTitle,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormField,
    NgIf,
    RouterLink
  ],
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm!: FormGroup;
  hidePassword = true;

  constructor(private fb: FormBuilder,
              private authService:AuthService,
              private snackbar:MatSnackBar,
              private router:Router
  ){
    this.loginForm = this.fb.group({
      nickname:[null,[Validators.required]],
      password:[null,[Validators.required]]
    })
  }

  togglePasswordVisibility(){
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(){
    const loginData = {
      nickname: this.loginForm.get('nickname')?.value,
      pswrd: this.loginForm.get('password')?.value  // renomme password en pswrd
    };

    console.log('Sending login request with data:', loginData);

    this.authService.login(loginData).subscribe({
      next: (res) => {
        console.log(res);
        if (res.nickname != null) {
          const user = {
            nickname: res.nickname,
            age: res.age,
            gender: res.gender
          }
          StorageService.saveUser(user);
          StorageService.saveToken(res.jwt);
          this.router.navigateByUrl("/player/home");
          this.snackbar.open("Login successful", "Close", {duration: 5000});
        } else {
          this.snackbar.open("Invalid credentials", "Close", {duration: 5000, panelClass: "error-snackbar"})
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        let errorMessage = "Invalid credentials";

        if (error.status === 401 || error.status === 403) {
          errorMessage = "Incorrect username or password";
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }

        this.snackbar.open(errorMessage, "Close", {
          duration: 5000,
          panelClass: "error-snackbar"
        });
      }
    })
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

}
