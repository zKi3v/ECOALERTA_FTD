import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

export interface BannedUserDialogData {
  title: string;
  message: string;
}

@Component({
  selector: 'app-banned-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <p>{{ data.message }}</p>
        <p class="normas-link">
          Para más información, consulta nuestras 
          <a href="#" (click)="goToNormas()" class="link-normas">NORMAS DE LA COMUNIDAD</a>
        </p>
      </mat-dialog-content>
      
      <mat-dialog-actions class="dialog-actions">
        <button mat-raised-button color="primary" (click)="close()">Entendido</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 20px;
      text-align: center;
    }
    
    .dialog-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .warning-icon {
      font-size: 48px;
      color: #f44336;
      margin-bottom: 10px;
    }
    
    .dialog-content {
      margin-bottom: 20px;
      line-height: 1.6;
    }
    
    .normas-link {
      margin-top: 15px;
      font-size: 14px;
    }
    
    .link-normas {
      color: #4CAF50;
      text-decoration: none;
      font-weight: bold;
      cursor: pointer;
    }
    
    .link-normas:hover {
      text-decoration: underline;
    }
    
    .dialog-actions {
      justify-content: center;
    }
  `]
})
export class BannedUserDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<BannedUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BannedUserDialogData,
    private router: Router
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  goToNormas(): void {
    this.dialogRef.close();
    this.router.navigate(['/normas']);
  }
}