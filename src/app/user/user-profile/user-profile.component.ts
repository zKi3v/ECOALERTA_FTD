import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, UsuarioResponse, UsuarioActualizarDTO, CambioContrasenaRequest } from '../../services/backend/user.service';
import { Auth } from '../../services/backend/auth.service';
import { LoadingDialogComponent } from '../../shared/dialogs/loading-dialog.component';
import { SuccessDialogComponent } from '../../shared/dialogs/success-dialog.component';
import { ErrorDialogComponent } from '../../shared/dialogs/error-dialog.component';
import { ConfirmationDialogComponent } from '../../shared/dialogs/confirmation-dialog.component';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="profile-container">
      <div class="header">
        <button mat-icon-button class="back-button" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          <span style="margin-left: 8px; font-weight: 600;">VOLVER</span>
        </button>
        <div class="logo">🍃 ECOALERTA</div>
        <div class="spacer"></div>
      </div>
      
      <h1 class="title">CENTRO DE USUARIO</h1>
      
      <mat-card class="profile-card">
        <div class="card-header">
          <p class="subtitle">Aquí podrás ver y modificar tus datos.</p>
        </div>
    
        <div *ngIf="isLoading" class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando datos del perfil...</p>
        </div>
    
        <form *ngIf="!isLoading" [formGroup]="profileForm" class="profile-form">
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Correo electrónico</mat-label>
              <input matInput type="email" formControlName="email" readonly>
              <mat-icon matSuffix matTooltip="Este dato es privado">lock</mat-icon>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Nombre de usuario</mat-label>
              <input matInput formControlName="username" [readonly]="!editingUsername">
              @if (!editingUsername && !userData?.usernameModificado) {
                <button mat-icon-button matSuffix (click)="toggleEdit('username')">
                  <mat-icon>edit</mat-icon>
                </button>
              } @else {
                <mat-icon matSuffix matTooltip="{{userData?.usernameModificado ? 'Ya has modificado tu nombre de usuario' : 'Este dato es privado'}}">{{userData?.usernameModificado ? 'block' : 'lock'}}</mat-icon>
              }
              @if (userData?.usernameModificado) {
                <mat-hint>Ya has modificado tu nombre de usuario</mat-hint>
              } @else {
                <mat-hint>Solo puedes cambiar tu nombre de usuario una vez</mat-hint>
              }
            </mat-form-field>
          </div>
    
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Nombre completo</mat-label>
              <input matInput formControlName="fullName">
              <mat-icon matSuffix matTooltip="Este dato es privado">lock</mat-icon>
            </mat-form-field>
          </div>
    
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Contraseña</mat-label>
              <input matInput type="password" formControlName="password" [readonly]="!editingPassword">
              @if (!editingPassword) {
                <button mat-icon-button matSuffix (click)="toggleEdit('password')">
                  <mat-icon>edit</mat-icon>
                </button>
              }
              @if (lastPasswordUpdate) {
                <mat-hint align="end">
                  Última modificación: {{lastPasswordUpdate | date}}
                </mat-hint>
              }
            </mat-form-field>
          </div>
    
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Celular</mat-label>
              <input matInput formControlName="phone">
              <mat-icon matSuffix matTooltip="Este dato es privado">lock</mat-icon>
            </mat-form-field>
          </div>
    
          <div class="privacy-notice">
            <mat-icon>info</mat-icon>
            <p>Tus datos personales se mantendrán de forma privada ante otros usuarios excepto tu usuario.</p>
          </div>
    
          <div class="account-status">
            <h3>Estado de cuenta: <span [class.active]="accountActive">{{accountActive ? 'Activo' : 'Inactivo'}}</span></h3>
            <p class="status-note">Tu cuenta se mostrará inactiva cuando se incumplan las normas.</p>
          </div>
    
          <div class="form-actions">
            <button mat-button color="primary" (click)="goBack()">
              VOLVER
            </button>
            <button mat-raised-button color="primary" (click)="saveChanges()" [disabled]="!profileForm.valid || !profileForm.dirty">
              GUARDAR
            </button>
          </div>
        </form>
      </mat-card>
    </div>
    `,
  styles: [`
    .profile-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
      font-family: 'Roboto', sans-serif;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .back-button {
      display: flex;
      align-items: center;
      background: none;
      border: none;
      color: #2e7d32;
      font-weight: 600;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(46, 125, 50, 0.1);
      }
    }

    .logo {
      font-size: 1.5rem;
      font-weight: bold;
      color: #2e7d32;
      text-align: center;
      flex: 1;
    }

    .spacer {
      width: 48px; /* Same width as back button */
    }

    .title {
      text-align: center;
      font-size: 2rem;
      font-weight: 700;
      color: #2e7d32;
      margin: 2rem 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .profile-card {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto 2rem;
      width: calc(100% - 4rem);
    }

    .card-header {
      text-align: center;
      margin-bottom: 2rem;

      .subtitle {
        color: #666;
        margin: 0;
        font-size: 1.1rem;
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      
      p {
        margin-top: 1rem;
        color: #666;
        font-size: 1.1rem;
      }
    }

    .profile-form {
      .form-row {
        margin-bottom: 1.5rem;
        
        mat-form-field {
          width: 100%;
          
          ::ng-deep .mat-mdc-form-field-focus-overlay {
            background-color: rgba(46, 125, 50, 0.1);
          }
          
          ::ng-deep .mat-mdc-text-field-wrapper.mdc-text-field--focused .mdc-notched-outline__leading,
          ::ng-deep .mat-mdc-text-field-wrapper.mdc-text-field--focused .mdc-notched-outline__notch,
          ::ng-deep .mat-mdc-text-field-wrapper.mdc-text-field--focused .mdc-notched-outline__trailing {
            border-color: #2e7d32;
          }
          
          ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-floating-label {
            color: #2e7d32;
          }
        }
      }
    }

    .privacy-notice {
      display: flex;
      align-items: start;
      gap: 1rem;
      padding: 1.5rem;
      background: rgba(46, 125, 50, 0.1);
      border-radius: 12px;
      margin: 2rem 0;
      border-left: 4px solid #2e7d32;

      mat-icon {
        color: #2e7d32;
        margin-top: 2px;
      }

      p {
        margin: 0;
        color: #2e7d32;
        font-size: 0.95rem;
        line-height: 1.5;
        font-weight: 500;
      }
    }

    .account-status {
      margin: 2rem 0;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 12px;
      border: 1px solid rgba(46, 125, 50, 0.2);
      
      h3 {
        color: #333;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        
        span {
          &.active {
            color: #2e7d32;
            font-weight: 700;
          }
        }
      }

      .status-note {
        color: #666;
        font-size: 0.9rem;
        margin: 0;
        line-height: 1.4;
      }
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 2px solid rgba(46, 125, 50, 0.1);
      gap: 1rem;
      
      button {
        min-width: 120px;
        font-weight: 600;
        border-radius: 8px;
        
        &.mat-mdc-raised-button {
          background-color: #2e7d32;
          color: white;
          
          &:hover {
            background-color: #1b5e20;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
          }
          
          &:disabled {
            background-color: #ccc;
            color: #666;
          }
        }
        
        &.mat-mdc-button {
          color: #2e7d32;
          
          &:hover {
            background-color: rgba(46, 125, 50, 0.1);
          }
        }
      }
    }

    ::ng-deep .error-snackbar {
      background-color: #f44336;
      color: white;
    }

    @media (max-width: 768px) {
      .profile-card {
        margin: 0 1rem 2rem;
        padding: 1.5rem;
      }
      
      .title {
        font-size: 1.5rem;
        margin: 1rem 0;
      }
      
      .form-actions {
        flex-direction: column;
        
        button {
          width: 100%;
        }
      }
    }
  `]
})
export class UserProfileComponent implements OnInit {
  profileForm: FormGroup;
  editingUsername = false;
  editingPassword = false;
  accountActive = true;
  lastPasswordUpdate = new Date('2025-06-01');
  isLoading = true;
  userData: UsuarioResponse | null = null;
  canChangePassword = true; // Controla si puede cambiar contraseña (cada 6 meses)
  lastPasswordChangeDate = new Date('2024-07-01'); // Fecha del último cambio

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private userService: UserService,
    private auth: Auth,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      password: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]]
    });
  }

  ngOnInit() {
    this.cargarDatosUsuario();
  }

  cargarDatosUsuario() {
    const token = this.auth.obtenerToken();
    if (!token) {
      this.mostrarError('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
      this.isLoading = false;
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 2000);
      return;
    }

    this.userService.obtenerPerfil(token).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          this.userData = response.data;
          this.llenarFormulario(response.data);
          this.accountActive = response.data.activo;
        } else {
          this.mostrarError('No se pudieron cargar los datos del perfil');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar datos del usuario:', error);
        let mensajeError = 'Error al cargar los datos del perfil';
        
        if (error.status === 401) {
          mensajeError = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
          setTimeout(() => {
            this.auth.cerrarSesion();
            this.router.navigate(['/auth/login']);
          }, 2000);
        } else if (error.status === 0) {
          mensajeError = 'No se puede conectar con el servidor. Verifica tu conexión.';
        } else if (error.error?.message) {
          mensajeError = error.error.message;
        }
        
        this.mostrarError(mensajeError);
        this.isLoading = false;
      }
    });
  }

  llenarFormulario(userData: UsuarioResponse) {
    this.profileForm.patchValue({
      fullName: `${userData.nombre} ${userData.apellido}`,
      email: userData.correo,
      username: userData.username,
      password: '••••••••', // Placeholder para contraseña
      phone: userData.telefono || ''
    });
  }

  toggleEdit(field: 'username' | 'password') {
    if (field === 'username') {
      this.editingUsername = !this.editingUsername;
    } else {
      this.editingPassword = !this.editingPassword;
    }
  }

  saveChanges() {
    if (this.profileForm.valid && this.userData) {
      const usernameChanged = this.editingUsername && this.profileForm.get('username')?.value !== this.userData?.username;
      const passwordChanged = this.editingPassword && this.profileForm.get('password')?.value !== '••••••••';
      
      // Verificar si puede cambiar contraseña (cada 6 meses)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const canChangePassword = this.lastPasswordChangeDate <= sixMonthsAgo;
      
      if (passwordChanged && !canChangePassword) {
        this.mostrarError('Solo puedes cambiar tu contraseña cada 6 meses');
        return;
      }
      
      if (usernameChanged && this.userData?.usernameModificado) {
        this.mostrarError('Ya has cambiado tu nombre de usuario anteriormente');
        return;
      }
      
      // Preparar mensajes de confirmación
      let confirmationMessages: string[] = [];
      
      if (usernameChanged) {
        confirmationMessages.push('• Solo podrás cambiar tu nombre de usuario una vez');
      }
      
      if (passwordChanged) {
        confirmationMessages.push('• Solo podrás cambiar tu contraseña nuevamente en 6 meses');
      }
      
      if (confirmationMessages.length > 0) {
        const dialogData = {
          title: 'Confirmar cambios',
          message: `Estás a punto de realizar cambios importantes:\n\n${confirmationMessages.join('\n')}\n\n¿Deseas continuar?`,
          confirmText: 'Confirmar',
          cancelText: 'Cancelar',
          icon: 'warning'
        };
        
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
          width: '450px',
          data: dialogData
        });
        
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.performSave(usernameChanged, passwordChanged);
          }
        });
      } else {
        this.performSave(usernameChanged, passwordChanged);
      }
    }
  }
  
  private performSave(usernameChanged: boolean, passwordChanged: boolean) {
    const loadingDialogRef = this.dialog.open(LoadingDialogComponent, {
      width: '300px',
      data: { message: 'Actualizando perfil...' },
      disableClose: true
    });
    
    const token = this.auth.obtenerToken();
    if (!token) {
      loadingDialogRef.close();
      this.mostrarError('No se encontró token de autenticación');
      return;
    }

    const formValue = this.profileForm.value;
    
    if (passwordChanged) {
      // Cambiar contraseña usando el endpoint específico
      this.cambiarContrasena(token, formValue.password, loadingDialogRef);
    } else if (usernameChanged) {
      // Actualizar perfil (incluyendo username)
      this.actualizarPerfil(token, usernameChanged, loadingDialogRef);
    } else {
      // Actualizar solo datos básicos del perfil
      this.actualizarPerfil(token, usernameChanged, loadingDialogRef);
    }
  }
  
  private cambiarContrasena(token: string, nuevaContrasena: string, loadingDialogRef: any) {
    // Para el cambio de contraseña, necesitamos la contraseña actual
    // Por simplicidad, vamos a pedir la contraseña actual en un diálogo
    loadingDialogRef.close();
    
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar contraseña actual',
        message: 'Para cambiar tu contraseña, ingresa tu contraseña actual:',
        confirmText: 'Cambiar contraseña',
        cancelText: 'Cancelar',
        requiresInput: true,
        inputType: 'password',
        inputPlaceholder: 'Contraseña actual'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.input) {
        const loadingDialogRef2 = this.dialog.open(LoadingDialogComponent, {
          width: '300px',
          data: { message: 'Cambiando contraseña...' },
          disableClose: true
        });
        
        const cambioContrasenaData: CambioContrasenaRequest = {
          contrasenaActual: result.input,
          nuevaContrasena: nuevaContrasena,
          confirmarNuevaContrasena: nuevaContrasena
        };
        
        this.userService.cambiarContrasena(token, cambioContrasenaData).subscribe({
          next: (response) => {
            loadingDialogRef2.close();
            
            if (response.status === 'success') {
              this.lastPasswordChangeDate = new Date();
              
              this.dialog.open(SuccessDialogComponent, {
                width: '400px',
                data: {
                  title: 'Contraseña actualizada',
                  message: 'Tu contraseña ha sido cambiada correctamente'
                }
              });
              
              this.editingPassword = false;
              this.profileForm.get('password')?.setValue('••••••••');
              this.profileForm.markAsPristine();
            }
          },
          error: (error) => {
            loadingDialogRef2.close();
            console.error('Error al cambiar contraseña:', error);
            let mensajeError = 'Error al cambiar la contraseña';
            
            if (error.status === 403 && error.error?.message) {
              mensajeError = error.error.message;
            }
            
            this.dialog.open(ErrorDialogComponent, {
              width: '400px',
              data: {
                title: 'Error',
                message: mensajeError
              }
            });
          }
        });
      }
    });
  }
  
  private actualizarPerfil(token: string, usernameChanged: boolean, loadingDialogRef: any) {
    const formValue = this.profileForm.value;
    const [nombre, ...apellidoParts] = formValue.fullName.split(' ');
    const apellido = apellidoParts.join(' ');

    const datosActualizacion = {
      nombre: nombre,
      apellido: apellido,
      telefono: formValue.phone,
      direccion: this.userData?.direccion || '',
      idUbigeo: this.userData?.ubigeo?.idUbigeo || 1,
      ...(usernameChanged && { username: formValue.username })
    };

    this.userService.actualizarPerfil(token, datosActualizacion).subscribe({
      next: (response) => {
        loadingDialogRef.close();
        
        if (response.status === 'success') {
          // Actualizar estados si los cambios fueron exitosos
          if (usernameChanged) {
            // Actualizar los datos de usuario con el nuevo username
            this.userData!.username = formValue.username;
            this.userData!.usernameModificado = true;
          }
          
          this.dialog.open(SuccessDialogComponent, {
            width: '400px',
            data: {
              title: 'Perfil actualizado',
              message: 'Tu perfil ha sido actualizado correctamente'
            }
          });
          
          this.editingUsername = false;
          this.profileForm.markAsPristine();
          
          // Recargar datos del usuario
          this.cargarDatosUsuario();
        }
      },
      error: (error) => {
        loadingDialogRef.close();
        console.error('Error al actualizar perfil:', error);
        let mensajeError = 'Error al actualizar el perfil';
        
        if (error.status === 403 && error.error?.message) {
          mensajeError = error.error.message;
        }
        
        this.dialog.open(ErrorDialogComponent, {
          width: '400px',
          data: {
            title: 'Error',
            message: mensajeError
          }
        });
      }
    });
  }

  mostrarMensaje(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  mostrarError(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
