import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface VerificationDialogData {
  title: string;
  message: string;
  email: string;
}

@Component({
  selector: 'app-verification-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="verification-dialog">
      <div class="dialog-header">
        <mat-icon class="success-icon">check_circle</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>
      
      <div mat-dialog-content class="dialog-content">
        <p class="success-message">{{ data.message }}</p>
        
        <div class="verification-section">
          <h3>Verificación alternativa</h3>
          <p class="verification-info">
            También puedes verificar tu cuenta ingresando el código de 6 dígitos que enviamos a:
            <strong>{{ data.email }}</strong>
          </p>
          
          <form [formGroup]="verificationForm" class="verification-form">
            <mat-form-field appearance="outline" class="code-field">
              <mat-label>Código de verificación</mat-label>
              <input matInput 
                     formControlName="codigo" 
                     placeholder="000000"
                     maxlength="6"
                     (input)="onCodeInput($event)">
              @if (verificationForm.get('codigo')?.hasError('required')) {
                <mat-error>El código es requerido</mat-error>
              }
              @if (verificationForm.get('codigo')?.hasError('pattern')) {
                <mat-error>El código debe tener 6 dígitos</mat-error>
              }
            </mat-form-field>
            
            <button mat-raised-button 
                    color="primary" 
                    (click)="onVerifyCode()"
                    [disabled]="!verificationForm.valid"
                    class="verify-btn">
              <mat-icon>verified</mat-icon>
              Verificar código
            </button>
          </form>
          
          <button mat-button (click)="onResendCode()" class="resend-btn">
            <mat-icon>refresh</mat-icon>
            Reenviar código
          </button>
        </div>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onClose()" class="close-btn">
          Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .verification-dialog {
      padding: 20px;
      min-width: 500px;
      max-width: 600px;
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .success-icon {
      color: #4caf50;
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
    
    .success-message {
      margin: 0 0 30px 0;
      color: #666;
      line-height: 1.5;
      font-size: 16px;
    }
    
    .verification-section {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #2196f3;
    }
    
    .verification-section h3 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 18px;
      font-weight: 500;
    }
    
    .verification-info {
      margin: 0 0 20px 0;
      color: #666;
      line-height: 1.5;
    }
    
    .verification-info strong {
      color: #2196f3;
    }
    
    .verification-form {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .code-field {
      width: 200px;
    }
    
    .code-field input {
      text-align: center;
      font-size: 18px;
      font-weight: 500;
      letter-spacing: 2px;
    }
    
    .verify-btn {
      width: 200px;
      height: 45px;
      background-color: #4caf50;
    }
    
    .resend-btn {
      color: #2196f3;
      align-self: flex-start;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
    }
    
    .close-btn {
      color: #666;
    }
    
    @media (max-width: 600px) {
      .verification-dialog {
        min-width: auto;
        width: 90vw;
        padding: 15px;
      }
      
      .code-field {
        width: 100%;
      }
      
      .verify-btn {
        width: 100%;
      }
    }
  `]
})
export class VerificationDialogComponent {
  verificationForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<VerificationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VerificationDialogData,
    private fb: FormBuilder
  ) {
    this.verificationForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
    });
  }

  onCodeInput(event: any): void {
    // Solo permitir números
    const value = event.target.value.replace(/[^0-9]/g, '');
    this.verificationForm.get('codigo')?.setValue(value);
  }

  onVerifyCode(): void {
    if (this.verificationForm.valid) {
      const codigo = this.verificationForm.get('codigo')?.value;
      this.dialogRef.close({ action: 'verify', codigo });
    }
  }

  onResendCode(): void {
    this.dialogRef.close({ action: 'resend' });
  }

  onClose(): void {
    this.dialogRef.close({ action: 'close' });
  }
}