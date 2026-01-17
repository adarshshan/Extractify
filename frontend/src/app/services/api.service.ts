import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface for the initial job creation response
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

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = '/api'; // Backend API URL

  constructor(private http: HttpClient) {}

  /**
   * Uploads the PDF and starts the extraction job.
   * @param file The PDF file to upload.
   * @returns An Observable with the job creation response.
   */
  startExtractionJob(file: File): Observable<JobCreationResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<JobCreationResponse>(`${this.apiUrl}/extract`, formData);
  }

  /**
   * Gets the status of a specific job.
   * @param jobId The ID of the job to check.
   * @returns An Observable with the job's current status.
   */
  getJobStatus(jobId: string): Observable<JobStatus> {
    return this.http.get<JobStatus>(`${this.apiUrl}/status/${jobId}`);
  }

  downloadExcel(reportId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${reportId}`, {
      responseType: 'blob',
    });
  }
}
