import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, of } from 'rxjs';
import { StorageService } from '../../../auth/services/storage/storage.service';
import { environment } from '../../../../environments/environment.prod';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CharacService {
  private apiUrl = `${environment.apiUrl}/api/characs`; // Updated endpoint

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = StorageService.getToken();
    console.log('Using token:', token); // Debug log
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getAllCharacs(): Observable<any[]> {
    console.log('Fetching characters from:', this.apiUrl); // Debug log
    return this.http.get<any[]>(this.apiUrl, { 
      headers: this.getHeaders(),
      withCredentials: true 
    }).pipe(
      catchError(error => {
        console.error('Error loading characters:', error);
        return throwError(() => error);
      })
    );
  }

  getCharacById(idC: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${idC}`, { 
      headers: this.getHeaders(),
      withCredentials: true 
    }).pipe(
      catchError(error => {
        console.error(`Error loading character ${idC}:`, error);
        return throwError(() => error);
      })
    );
  }

  createCharac(charac: any, image?: File): Observable<any> {
    const formData = new FormData();
    formData.append('charac', new Blob([JSON.stringify(charac)], {
      type: 'application/json'
    }));

    if (image) {
      formData.append('image', image, image.name);
    }

    return this.http.post<any>(this.apiUrl, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${StorageService.getToken()}`
      }),
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error creating character:', error);
        return throwError(() => error);
      })
    );
  }

  getCharacImageUrl(characId: number): Observable<string> {
    console.log('Requesting image URL for character:', characId);
    
    return this.http.get(`${this.apiUrl}/${characId}/image-url`, {
      headers: this.getHeaders(),
      responseType: 'text',
      withCredentials: true
    }).pipe(
      map(url => {
        console.log('Received raw URL:', url);
        
        // If it's a local URL (starting with /), prefix with API URL
        if (url.startsWith('/')) {
          const fullUrl = `${environment.apiUrl}${url}`;
          console.log('Constructed full URL:', fullUrl);
          return fullUrl;
        }
        
        // If it's localhost, replace with production URL
        if (url.includes('localhost:8080')) {
          const productionUrl = url.replace('http://localhost:8080', environment.apiUrl);
          console.log('Converted localhost URL to:', productionUrl);
          return productionUrl;
        }
        
        // Ensure HTTPS
        const secureUrl = url.replace('http://', 'https://');
        console.log('Final URL:', secureUrl);
        return secureUrl;
      }),
      catchError(error => {
        console.error(`Error loading character image ${characId}:`, error);
        // Return a default image URL if there's an error
        return of(`${environment.apiUrl}/images/default.png`);
      })
    );
  }
}