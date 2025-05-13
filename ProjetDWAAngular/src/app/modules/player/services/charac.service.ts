import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {StorageService} from '../../../auth/services/storage/storage.service';

const BASE_URL = 'http://localhost:8080/api/characs';

@Injectable({
  providedIn: 'root'
})
export class CharacService {

  constructor(private http: HttpClient) { }

  getAllCharacs(): Observable<any[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${StorageService.getToken()}`,
    });
    return this.http.get<any[]>(`${BASE_URL}`, { headers });
  }


  getCharacById(idC : number): Observable<any[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${StorageService.getToken()}`,
    });
    return this.http.get<any[]>(`${BASE_URL}/${idC}`, { headers });
  }

  createCharac(charac: any, image: File): Observable<any> {
    const formData = new FormData();

    formData.append('charac', new Blob([JSON.stringify(charac)], {
      type: 'application/json'
    }));

    if (image) {
      console.log("Image détails:", {
        nom: image.name,
        type: image.type,
        taille: image.size,
        derniereModification: image.lastModified
      });
      formData.append('image', image, image.name);
    } else {
      console.log("Aucune image fournie");
    }
    console.log("FormData contient 'charac':", formData.has('charac'));
    console.log("FormData contient 'image':", formData.has('image'));

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${StorageService.getToken()}`,
    });

    return this.http.post<any>(`${BASE_URL}`, formData, { headers });
  }

  getCharacImageUrl(characId: number): Observable<string> {
    const headers = new HttpHeaders({
      'Accept': 'text/plain',
      'Authorization': `Bearer ${StorageService.getToken()}`,
    });
    const id = typeof characId === 'object' ? (characId as any).idC : characId;

    // Utiliser l'ID correctement extrait et attendre une chaîne
    return this.http.get(`${BASE_URL}/${id}/image-url`, {headers, responseType: 'text'});
  }

}
