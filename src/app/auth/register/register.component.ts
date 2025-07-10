import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

import { Auth, RegistroRequest } from '../../services/backend/auth.service';
import { LoadingDialogComponent } from '../../shared/dialogs/loading-dialog.component';
import { SuccessDialogComponent } from '../../shared/dialogs/success-dialog.component';
import { ErrorDialogComponent } from '../../shared/dialogs/error-dialog.component';
import { ConfirmationDialogComponent } from '../../shared/dialogs/confirmation-dialog.component';
import { VerificationDialogComponent } from '../../shared/dialogs/verification-dialog.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  verificationForm!: FormGroup;
  hidePassword = true;
  listaUbigeos: { id: number; nombre: string }[] = [];
  isLoading = false;
  showVerificationCode = false;
  userEmail = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: Auth,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
      direccion: ['', [Validators.required, Validators.minLength(3)]],
      idUbigeo: [1, Validators.required] // Valor predeterminado: La Esperanza (id: 1)
    });
    
    this.verificationForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
    });

    // Solo "La Esperanza" como opción disponible
    this.listaUbigeos = [
      { id: 1, nombre: 'La Esperanza' }
    ];
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    const datos: RegistroRequest = this.registerForm.value;
    this.userEmail = datos.correo;
    
    // Abrir popup de carga
    const dialogRef = this.dialog.open(LoadingDialogComponent, {
      disableClose: true,
      width: '300px',
      data: { message: 'Registrando usuario...' }
    });

    this.auth.registro(datos).subscribe({
      next: (resp) => {
        dialogRef.close();
        if (resp.status === 'success') {
          // Mostrar diálogo de verificación
          const verificationDialogRef = this.dialog.open(VerificationDialogComponent, {
            width: '600px',
            data: {
              title: 'Registro exitoso',
              message: 'Tu cuenta ha sido creada exitosamente. Hemos enviado un enlace de verificación a tu correo electrónico.',
              email: this.userEmail
            },
            disableClose: true
          });
          
          verificationDialogRef.afterClosed().subscribe(result => {
            if (result?.action === 'verify') {
              this.verifyWithCode(result.codigo);
            } else if (result?.action === 'resend') {
              this.resendVerificationCode();
            } else {
              this.router.navigate(['/login']);
            }
          });
        } else {
          // Mostrar popup de error
          this.dialog.open(ErrorDialogComponent, {
            width: '400px',
            data: { 
              title: 'Error en el Registro',
              message: resp.message || 'Fallo en el registro' 
            }
          });
        }
      },
      error: (err) => {
        dialogRef.close();
        console.error(err);
        // Mostrar popup de error
        this.dialog.open(ErrorDialogComponent, {
          width: '400px',
          data: { 
            title: 'Error',
            message: 'Ocurrió un error al registrarse' 
          }
        });
      }
    });
  }
  
  private verifyWithCode(codigo: string) {
    const loadingDialogRef = this.dialog.open(LoadingDialogComponent, {
      width: '300px',
      data: { message: 'Verificando código...' },
      disableClose: true
    });
    
    const verificationData = {
      correo: this.userEmail,
      codigo: codigo
    };
    
    this.auth.verificarCuenta(verificationData).subscribe({
      next: (response: any) => {
        loadingDialogRef.close();
        
        this.dialog.open(SuccessDialogComponent, {
          width: '400px',
          data: {
            title: 'Cuenta verificada',
            message: '¡Excelente! Tu cuenta ha sido verificada correctamente. Ya puedes iniciar sesión.'
          }
        }).afterClosed().subscribe(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (error: any) => {
        loadingDialogRef.close();
        
        this.dialog.open(ErrorDialogComponent, {
          width: '400px',
          data: {
            title: 'Código incorrecto',
            message: 'El código ingresado no es válido. Por favor, verifica e inténtalo nuevamente.'
          }
        }).afterClosed().subscribe(() => {
          // Volver a mostrar el diálogo de verificación
          this.showVerificationDialog();
        });
      }
    });
  }
  
  private resendVerificationCode() {
    const loadingDialogRef = this.dialog.open(LoadingDialogComponent, {
      width: '300px',
      data: { message: 'Reenviando código...' },
      disableClose: true
    });
    
    this.auth.reenviarCodigo(this.userEmail).subscribe({
      next: (response) => {
        loadingDialogRef.close();
        
        this.dialog.open(SuccessDialogComponent, {
          width: '400px',
          data: {
            title: 'Código reenviado',
            message: 'Se ha enviado un nuevo código de verificación a tu correo electrónico.'
          }
        }).afterClosed().subscribe(() => {
          this.showVerificationDialog();
        });
      },
      error: (error) => {
        loadingDialogRef.close();
        
        this.dialog.open(ErrorDialogComponent, {
          width: '400px',
          data: {
            title: 'Error',
            message: 'No se pudo reenviar el código. Inténtalo nuevamente.'
          }
        }).afterClosed().subscribe(() => {
          this.showVerificationDialog();
        });
      }
    });
  }
  
  private showVerificationDialog() {
    const verificationDialogRef = this.dialog.open(VerificationDialogComponent, {
      width: '600px',
      data: {
        title: 'Verificar cuenta',
        message: 'Ingresa el código de verificación que enviamos a tu correo electrónico.',
        email: this.userEmail
      },
      disableClose: true
    });
    
    verificationDialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'verify') {
        this.verifyWithCode(result.codigo);
      } else if (result?.action === 'resend') {
        this.resendVerificationCode();
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
  
  getFormErrors() {
    const errors: any = {};
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }
  
  debugClick(event: Event) {
    console.log('Botón clickeado!', event);
    console.log('Form valid:', this.registerForm.valid);
    console.log('Form errors:', this.getFormErrors());
    alert('Botón clickeado! Revisa la consola para más detalles.');
  }
}
