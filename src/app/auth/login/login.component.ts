import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { Auth, LoginRequest, JwtResponse, RespuestaJsend } from '../../services/backend/auth.service';
import { LoadingDialogComponent } from '../../shared/dialogs/loading-dialog.component';
import { SuccessDialogComponent } from '../../shared/dialogs/success-dialog.component';
import { ErrorDialogComponent } from '../../shared/dialogs/error-dialog.component';
import { BannedUserDialogComponent } from '../../shared/dialogs/banned-user-dialog.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid || this.cargando) return;

    const datos: LoginRequest = {
      correo: this.loginForm.value.email,
      contrasena: this.loginForm.value.password
    };

    this.cargando = true;

    this.authService.login(datos).subscribe({
      next: (respuesta: RespuestaJsend<JwtResponse>) => {
        if (respuesta.status === 'success' && respuesta.data) {
          // Usar el nuevo método del servicio para guardar token y datos del usuario
          this.authService.guardarToken(respuesta.data.token, respuesta.data, this.loginForm.value.rememberMe);
          this.snackBar.open(respuesta.message || 'Inicio de sesión exitoso', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/']); // O ruta protegida
        } else if (respuesta.status === 'fail') {
          // Verificar si el usuario está baneado
          if (respuesta.message && respuesta.message.toLowerCase().includes('baneada')) {
            this.dialog.open(BannedUserDialogComponent, {
              width: '450px',
              disableClose: true,
              data: {
                title: 'Cuenta Suspendida',
                message: 'Tu cuenta ha sido suspendida por incumplir las normas de la comunidad.'
              }
            });
          } else {
            this.snackBar.open(respuesta.message || 'Credenciales incorrectas', 'Cerrar', { duration: 3000 });
          }
        } else {
          this.snackBar.open('Error inesperado. Intente nuevamente.', 'Cerrar', { duration: 3000 });
        }
      },
      error: (err) => {
        console.error(err);
        
        // Verificar si es un error 403 (usuario baneado)
        if (err.status === 403) {
          // Verificar si el mensaje indica que el usuario está baneado
          if (err.error?.message && (err.error.message.toLowerCase().includes('baneada') || err.error.message.toLowerCase().includes('suspendida') || err.error.message.toLowerCase().includes('normas'))) {
            this.dialog.open(BannedUserDialogComponent, {
              width: '450px',
              disableClose: true,
              data: {
                title: 'Cuenta Suspendida',
                message: 'Tu cuenta ha sido suspendida por incumplir las normas de la comunidad.'
              }
            });
          } else {
            this.snackBar.open('Acceso denegado. Verifica tus credenciales.', 'Cerrar', { duration: 3000 });
          }
        } else {
          this.snackBar.open('Error de conexión o del servidor.', 'Cerrar', { duration: 3000 });
        }
      },
      complete: () => {
        this.cargando = false;
      }
    });
  }

  goToRegister() {
    console.log('Navegando a registro...');
    this.router.navigate(['/register']).then(
      (success) => console.log('Navegación exitosa:', success),
      (error) => console.error('Error en navegación:', error)
    );
  }

  showForgotPassword() {
    // Mostrar diálogo para solicitar email
    const email = prompt('Ingresa tu correo electrónico para restablecer tu contraseña:');
    
    if (email && email.trim()) {
      this.resetPassword(email.trim());
    }
  }

  private resetPassword(email: string) {
    const loadingDialog = this.dialog.open(LoadingDialogComponent, {
      disableClose: true,
      data: { message: 'Enviando solicitud de restablecimiento...' }
    });

    this.authService.recuperarContrasena(email).subscribe({
      next: (response) => {
        loadingDialog.close();
        this.dialog.open(SuccessDialogComponent, {
          data: {
            title: 'Solicitud enviada',
            message: 'Se ha enviado un enlace de restablecimiento a tu correo electrónico.'
          }
        });
      },
      error: (error) => {
        loadingDialog.close();
        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error',
            message: 'No se pudo enviar la solicitud. Verifica tu correo electrónico e intenta nuevamente.'
          }
        });
      }
    });
  }
}
