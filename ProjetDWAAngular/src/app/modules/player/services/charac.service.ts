import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from '../../../auth/services/storage/storage.service';
import { environment } from '../../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class CharacService {
  private apiUrl = `${environment.apiUrl}/api/characters`;  // Updated base URL

  constructor(private http: HttpClient) { }

  getAllCharacs(): Observable<any[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${StorageService.getToken()}`,
    });
    return this.http.get<any[]>(this.apiUrl, { headers });
  }

  getCharacById(idC: number): Observable<any[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${StorageService.getToken()}`,
    });
    return this.http.get<any[]>(`${this.apiUrl}/${idC}`, { headers });
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

    return this.http.post<any>(this.apiUrl, formData, { headers });
  }

  getCharacImageUrl(characId: number): Observable<string> {
    const headers = new HttpHeaders({
      'Accept': 'text/plain',
      'Authorization': `Bearer ${StorageService.getToken()}`,
    });
    const id = typeof characId === 'object' ? (characId as any).idC : characId;

    return this.http.get(`${this.apiUrl}/${id}/image-url`, { headers, responseType: 'text' });
  }
}