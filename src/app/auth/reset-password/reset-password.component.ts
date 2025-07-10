import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Auth } from '../../services/backend/auth.service';
import { LoadingDialogComponent } from '../../shared/dialogs/loading-dialog.component';
import { SuccessDialogComponent } from '../../shared/dialogs/success-dialog.component';
import { ErrorDialogComponent } from '../../shared/dialogs/error-dialog.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  token: string = '';
  email: string = '';
  isValidToken = false;
  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: Auth,
    private dialog: MatDialog
  ) {
    this.resetForm = this.fb.group({
      nuevaContrasena: ['', [Validators.required, Validators.minLength(6)]],
      confirmarContrasena: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.email = params['email'] || '';
      
      if (!this.token || !this.email) {
        this.showError('Enlace inválido', 'El enlace de restablecimiento no es válido.');
        return;
      }
      
      this.validateToken();
    });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('nuevaContrasena')?.value;
    const confirmPassword = group.get('confirmarContrasena')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  validateToken() {
    // Aquí podrías validar el token con el backend si tienes un endpoint para eso
    // Por ahora, asumimos que es válido si existe
    this.isValidToken = true;
    this.isLoading = false;
  }

  onSubmit() {
    if (this.resetForm.valid) {
      const loadingDialog = this.dialog.open(LoadingDialogComponent, {
        disableClose: true,
        data: { message: 'Restableciendo contraseña...' }
      });

      const resetData = {
        correo: this.email,
        codigo: this.token,
        nuevaContrasena: this.resetForm.get('nuevaContrasena')?.value
      };

      this.authService.restablecerContrasenaConLink(resetData).subscribe({
        next: (response: any) => {
          loadingDialog.close();
          this.dialog.open(SuccessDialogComponent, {
            data: {
              title: 'Contraseña restablecida',
              message: 'Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.'
            }
          }).afterClosed().subscribe(() => {
            this.router.navigate(['/login']);
          });
        },
        error: (error: any) => {
          loadingDialog.close();
          this.showError('Error', 'No se pudo restablecer la contraseña. El enlace puede haber expirado.');
        }
      });
    }
  }

  private showError(title: string, message: string) {
    this.dialog.open(ErrorDialogComponent, {
      data: { title, message }
    }).afterClosed().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}