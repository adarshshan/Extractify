import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, IRecord } from '../services/api.service';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-previous-uploads',
  templateUrl: './previous-uploads.html',
  styleUrls: ['./previous-uploads.css'],
  standalone: true,
  imports: [CommonModule],
})
export class PreviousUploadsComponent implements OnInit {
  records: IRecord[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.apiService.getRecords().subscribe({
      next: (data) => {
        this.records = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load records.';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  download(record: IRecord): void {
    if (!record?.excelFileName) {
      alert('Excel file name is not available for this record.');
      return;
    }

    this.apiService.downloadExcel(record.excelFileName).subscribe({
      next: (blob) => {
        saveAs(blob, record.excelFileName);
      },
      error: (err) => {
        alert('Failed to download the report.');
        console.error(err);
      },
    });
  }
}
