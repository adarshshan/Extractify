import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface JobCreationResponse {
  message: string;
  jobId: string;
}

// Interface for the job status response
export interface JobStatus {
  jobId: string;
  state: 'active' | 'completed' | 'failed' | 'waiting' | 'delayed';
  progress: number;
  returnValue: {
    reportId: string;
    recordId: string;
  } | null;
  failedReason: string | null;
}

export interface IRecord {
  _id: string;
  fileName: string;
  createdAt: string;
  reportId: string;
  excelFileName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = '/api'; // Backend API URL

  constructor(private http: HttpClient) {}

  getRecords(): Observable<IRecord[]> {
    return this.http.get<IRecord[]>(`${this.apiUrl}/records`);
  }

  startExtractionJob(file: File): Observable<JobCreationResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<JobCreationResponse>(`${this.apiUrl}/extract`, formData);
  }

  getJobStatus(jobId: string): Observable<JobStatus> {
    return this.http.get<JobStatus>(`${this.apiUrl}/status/${jobId}`);
  }

  downloadExcel(reportId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${reportId}`, {
      responseType: 'blob',
    });
  }
}
