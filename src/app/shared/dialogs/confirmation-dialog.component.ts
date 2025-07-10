import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
  requiresInput?: boolean;
  inputType?: string;
  inputPlaceholder?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  template: `
    <div class="confirmation-dialog">
      <div class="dialog-header">
        <mat-icon class="warning-icon">{{ data.icon || 'warning' }}</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>
      
      <div mat-dialog-content class="dialog-content">
        <p>{{ data.message }}</p>
        
        <form *ngIf="data.requiresInput" [formGroup]="inputForm" class="input-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ data.inputPlaceholder || 'Ingrese el valor' }}</mat-label>
            <input matInput 
                   [type]="data.inputType || 'text'"
                   formControlName="inputValue"
                   [placeholder]="data.inputPlaceholder || 'Ingrese el valor'">
            <mat-error *ngIf="inputForm.get('inputValue')?.hasError('required')">
              Este campo es requerido
            </mat-error>
          </mat-form-field>
        </form>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()" class="cancel-btn">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button mat-raised-button 
                color="warn" 
                (click)="onConfirm()" 
                class="confirm-btn"
                [disabled]="data.requiresInput && inputForm.invalid">
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-dialog {
      padding: 20px;
      min-width: 400px;
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .warning-icon {
      color: #ff9800;
      font-size: 32px;
      margin-right: 15px;
    }
    
    h2 {
      margin: 0;
      color: #333;
      font-weight: 500;
    }
    
    .dialog-content {
      margin-bottom: 20px;
    }
    
    .dialog-content p {
      margin: 0;
      color: #666;
      line-height: 1.5;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    
    .cancel-btn {
      color: #666;
    }
    
    .confirm-btn {
      background-color: #ff5722;
    }
    
    .input-form {
      margin-top: 20px;
    }
    
    .full-width {
      width: 100%;
    }
  `]
})
export class ConfirmationDialogComponent {
  inputForm: FormGroup;
  
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData,
    private fb: FormBuilder
  ) {
    this.inputForm = this.fb.group({
      inputValue: ['', data.requiresInput ? Validators.required : []]
    });
  }

  onConfirm(): void {
    if (this.data.requiresInput) {
      if (this.inputForm.valid) {
        this.dialogRef.close({ confirmed: true, input: this.inputForm.get('inputValue')?.value });
      }
    } else {
      this.dialogRef.close(true);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}