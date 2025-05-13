import { Component} from '@angular/core';
import { NgClass, NgFor, NgIf, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DemoAngularMaterialModule } from './DemoAngularMaterialModules';
import { StorageService } from './auth/services/storage/storage.service';
import {Router, RouterLink, RouterLinkActive, RouterModule, RouterOutlet} from '@angular/router';
import {AuthService} from "./auth/services/auth/auth.service";


@Component({
  selector: 'app-root',
  imports: [NgClass, NgIf, FormsModule, DemoAngularMaterialModule, RouterLinkActive, RouterLink, RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Qui est-ce ?';
  isUserLoggedIn: boolean = StorageService.isUserLoggedIn();
  isDarkMode: boolean = false; //ne pas oublier d'implémenter la méthode pour changer le thème

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.subscribe(() => {
      this.isUserLoggedIn = StorageService.isUserLoggedIn();
    });
  }

  logout() {
    StorageService.logout();
    this.router.navigateByUrl('/login');
  }

    protected readonly AuthService = AuthService;
}
