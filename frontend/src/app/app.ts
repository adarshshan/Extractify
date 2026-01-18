import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, JobStatus } from './services/api.service';
import { saveAs } from 'file-saver';
import { Subject, timer } from 'rxjs';
import { switchMap, takeUntil, takeWhile } from 'rxjs/operators';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnDestroy {
  title = 'document-extract-frontend';

  // UI state
  isProcessing = false;
  progress = 0;
  statusMessage = 'Please upload a PDF file to begin.';
  error: string | null = null;
  finalReportId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }
    const file = input.files[0];

    // Reset state and start processing
    this.isProcessing = true;
    this.progress = 0;
    this.error = null;
    this.finalReportId = null;
    this.statusMessage = 'Uploading file...';
    this.cdr.detectChanges();

    this.apiService
      .startExtractionJob(file)
      .pipe(
        // Once we have the jobId, switch to a polling mechanism
        switchMap((response) => {
          this.statusMessage = 'Processing...';
          // Poll every 2 seconds
          return timer(0, 2000).pipe(
            switchMap(() => this.apiService.getJobStatus(response.jobId)),
            // Stop polling when the job is completed or has failed
            takeWhile((status) => status.state !== 'completed' && status.state !== 'failed', true)
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (status: JobStatus) => {
          this.progress = status.progress;

          if (status.state === 'active') {
            this.statusMessage = `Processing... ${status.progress}%`;
          } else if (status.state === 'completed') {
            this.isProcessing = false;
            this.statusMessage = 'Extraction complete! Your report is ready.';
            this.finalReportId = status.returnValue?.reportId ?? null;
          } else if (status.state === 'failed') {
            this.isProcessing = false;
            this.error = status.failedReason ?? 'An unknown error occurred.';
            this.statusMessage = 'Processing failed.';
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isProcessing = false;
          this.error = err.message || 'Failed to start the extraction process.';
          this.statusMessage = 'Error.';
          this.cdr.detectChanges();
        },
      });
  }

  onDownload() {
    if (this.finalReportId) {
      this.apiService.downloadExcel(this.finalReportId).subscribe((blob) => {
        saveAs(blob, `${this.finalReportId}.xlsx`);
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
