import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from './services/api.service';
import { saveAs } from 'file-saver';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  title = 'document-extract-frontend';
  selectedFile: File | null = null;
  status: string = 'Ready to upload';
  reportId: string | null = null;
  isProcessing: boolean = false;

  constructor(private apiService: ApiService) {}

  onFileSelected(event: Event) {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.selectedFile = element.files[0];
      this.status = `File selected: ${this.selectedFile.name}`;
      this.reportId = null; // Reset reportId on new file selection
    } else {
      this.selectedFile = null;
      this.status = 'No file selected';
    }
  }

  onUpload() {
    if (!this.selectedFile) {
      this.status = 'Please select a file first.';
      return;
    }

    this.isProcessing = true;
    this.status = 'Uploading and processing PDF...';

    this.apiService.uploadPdf(this.selectedFile).subscribe({
      next: (response) => {
        this.status = `Processing complete: ${response.message}`;
        this.reportId = response.reportId;
        this.isProcessing = false;
      },
      error: (error) => {
        this.status = `Error: ${error.message}`;
        console.error('Upload error', error);
        this.isProcessing = false;
      }
    });
  }

  onDownload() {
    if (!this.reportId) {
      this.status = 'No report available for download.';
      return;
    }

    this.status = 'Downloading Excel file...';
    this.apiService.downloadExcel(this.reportId).subscribe({
      next: (data) => {
        saveAs(data, this.reportId!);
        this.status = 'Excel file downloaded successfully.';
      },
      error: (error) => {
        this.status = `Error downloading: ${error.message}`;
        console.error('Download error', error);
      }
    });
  }
}