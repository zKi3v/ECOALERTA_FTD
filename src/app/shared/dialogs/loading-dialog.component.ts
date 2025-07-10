import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-dialog">
      <div class="loading-content">
        <mat-spinner diameter="50"></mat-spinner>
        <p class="loading-message">{{ data.message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .loading-dialog {
      padding: 24px;
      text-align: center;
      min-width: 250px;
    }
    
    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    
    .loading-message {
      margin: 0;
      font-size: 16px;
      color: #666;
    }
  `]
})
export class LoadingDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<LoadingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {}
}