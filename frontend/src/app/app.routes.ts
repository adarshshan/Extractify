import { Routes } from '@angular/router';
import { UploadComponent } from './upload/upload';
import { PreviousUploadsComponent } from './previous-uploads/previous-uploads';

export const routes: Routes = [
  { path: '', redirectTo: '/upload', pathMatch: 'full' },
  { path: 'upload', component: UploadComponent },
  { path: 'previous-uploads', component: PreviousUploadsComponent },
];
