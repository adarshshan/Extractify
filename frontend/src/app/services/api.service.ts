import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api'; // Backend API URL

  constructor(private http: HttpClient) {}

  uploadPdf(file: File): Observable<{ message: string; reportId: string }> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('name', 'Adarsh C'); //remove this after testing...
    return this.http.post<{ message: string; reportId: string }>(
      `${this.apiUrl}/extract`,
      formData
    );
  }

  downloadExcel(reportId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${reportId}`, {
      responseType: 'blob', // Important: specify responseType as 'blob' for file downloads
    });
  }
}
