import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { StorageService } from '../../../auth/services/storage/storage.service';
import { environment } from '../../../../environments/environment.prod';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CharacService {
  private apiUrl = `${environment.apiUrl}/api/characters`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${StorageService.getToken()}`
    });
  }

  getAllCharacs(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(error => {
        console.error('Error loading characters:', error);
        throw error;
      })
    );
  }

  getCharacById(idC: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${idC}`, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(error => {
        console.error(`Error loading character ${idC}:`, error);
        throw error;
      })
    );
  }

  createCharac(charac: any, image: File): Observable<any> {
    const formData = new FormData();
    formData.append('charac', new Blob([JSON.stringify(charac)], {
      type: 'application/json'
    }));

    if (image) {
      formData.append('image', image, image.name);
    }

    return this.http.post<any>(this.apiUrl, formData, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(error => {
        console.error('Error creating character:', error);
        throw error;
      })
    );
  }

  getCharacImageUrl(characId: number): Observable<string> {
    const id = typeof characId === 'object' ? (characId as any).idC : characId;
    
    return this.http.get(`${this.apiUrl}/${id}/image-url`, { 
      headers: this.getHeaders(),
      responseType: 'text' 
    }).pipe(
      map(url => url.replace('http://', 'https://')),
      catchError(error => {
        console.error(`Error loading character image ${id}:`, error);
        throw error;
      })
    );
  }
}