import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="success-dialog">
      <div class="dialog-header">
        <mat-icon class="success-icon">check_circle</mat-icon>
        <h2>{{ data.title }}</h2>
      </div>
      
      <div class="dialog-content">
        <p>{{ data.message }}</p>
      </div>
      
      <div class="dialog-actions">
        <button mat-raised-button color="primary" (click)="close()">Aceptar</button>
      </div>
    </div>
  `,
  styles: [`
    .success-dialog {
      padding: 24px;
      text-align: center;
      min-width: 300px;
    }
    
    .dialog-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    
    .success-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #4caf50;
    }
    
    h2 {
      margin: 0;
      color: #333;
      font-size: 20px;
    }
    
    .dialog-content {
      margin-bottom: 24px;
    }
    
    .dialog-content p {
      margin: 0;
      color: #666;
      font-size: 16px;
      line-height: 1.5;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: center;
    }
  `]
})
export class SuccessDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SuccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }
  ) {}
  
  close(): void {
    this.dialogRef.close();
  }
}