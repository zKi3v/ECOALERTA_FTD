import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReporteService, ReporteDetailDTO } from '../../services/backend/reporte.service';
import { Auth } from '../../services/backend/auth.service';
import { UserService } from '../../services/backend/user.service';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMenuModule,
    RouterModule,
    ReactiveFormsModule
],
  template: `
    <div class="container">
      <div class="header">
        <button mat-icon-button class="back-button" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          <span style="margin-left: 8px; font-weight: 600;">VOLVER</span>
        </button>
        <div class="logo">🍃 ECOALERTA</div>
        <div class="header-actions">
          <button *ngIf="isAdmin && reportDetail" mat-icon-button class="admin-button" (click)="approveReport()" matTooltip="Aprobar reporte">
            <mat-icon>check_circle</mat-icon>
          </button>
        </div>
      </div>
      <h1 class="title">DETALLE DEL REPORTE</h1>
      <main class="main-content">
        <div *ngIf="isLoading" class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando detalle del reporte...</p>
        </div>
        <div *ngIf="!isLoading && !reportDetail" class="error-container">
          <mat-icon>error_outline</mat-icon>
          <h3>No se pudo cargar el reporte</h3>
          <p>El reporte solicitado no existe o no tienes permisos para verlo.</p>
          <button mat-raised-button color="primary" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Volver a la lista
          </button>
        </div>
        <div *ngIf="!isLoading && reportDetail" class="detail-card">
          <div class="detail-header">
            <div class="report-info">
              <h2>{{reportDetail.titulo}}</h2>
              <div class="report-meta">
                <span class="report-id">ID: {{reportDetail.idReporte}}</span>
                <span class="report-status" [ngClass]="getStatusClass(reportDetail.estado)">
                  <mat-icon *ngIf="reportDetail.estado === 'APROBADO' || reportDetail.estado === 'validado'">check_circle</mat-icon>
                  <mat-icon *ngIf="reportDetail.estado === 'PENDIENTE' || reportDetail.estado === 'pendiente'">hourglass_empty</mat-icon>
                  <mat-icon *ngIf="reportDetail.estado === 'RECHAZADO' || reportDetail.estado === 'rechazado'">cancel</mat-icon>
                  <mat-icon *ngIf="reportDetail.estado === 'COMPLETADO' || reportDetail.estado === 'completado'">task_alt</mat-icon>
                  {{getStatusText(reportDetail.estado)}}
                </span>
              </div>
            </div>
          </div>
          <div class="detail-content">
            <div class="detail-section">
              <h3><mat-icon>schedule</mat-icon> Información General</h3>
              <div class="info-grid">
                <div class="info-item">
                  <label>Fecha de Reporte</label>
                  <p>{{formatDate(reportDetail.fechaReporte)}}</p>
                </div>
                <div class="info-item">
                  <label>Estado</label>
                  <p [ngClass]="getStatusClass(reportDetail.estado)">{{getStatusText(reportDetail.estado)}}</p>
                </div>
                <div class="info-item" *ngIf="!reportDetail.esAnonimo && reportDetail.correoUsuario">
                  <label>Usuario Reportante</label>
                  <p>{{reportDetail.correoUsuario}}</p>
                </div>
                <div class="info-item" *ngIf="reportDetail.esAnonimo">
                  <label>Usuario Reportante</label>
                  <p class="anonymous-user">Reporte Anónimo</p>
                </div>
              </div>
            </div>
            <div class="detail-section">
              <h3><mat-icon>description</mat-icon> Descripción</h3>
              <p class="description">{{reportDetail.descripcion}}</p>
            </div>
            <div class="detail-section" *ngIf="reportDetail.imagenUrl">
              <h3><mat-icon>image</mat-icon> Evidencia Fotográfica</h3>
              <div class="image-container">
                <img [src]="reportDetail.imagenUrl" alt="Evidencia del reporte" (error)="onImageError($event)" class="report-image">
              </div>
            </div>
            <div class="detail-section" *ngIf="isAdmin">
              <h3><mat-icon>admin_panel_settings</mat-icon> Acciones de Administrador</h3>
              <div class="admin-actions">
                <button mat-raised-button color="primary" (click)="approveReport()" [disabled]="reportDetail.estado === 'APROBADO'">
                  <mat-icon>check_circle</mat-icon>
                  Aprobar Reporte
                </button>
                <button mat-raised-button color="warn" (click)="rejectReport()" [disabled]="reportDetail.estado === 'RECHAZADO'">
                  <mat-icon>cancel</mat-icon>
                  Rechazar Reporte
                </button>
                <button mat-raised-button color="accent" (click)="downloadReportAsPDF()">
                  <mat-icon>picture_as_pdf</mat-icon>
                  Descargar PDF
                </button>
                <button mat-raised-button style="background-color: #ff5722; color: white;" (click)="reportReport()">
                  <mat-icon>report</mat-icon>
                  Denunciar Reporte
                </button>
              </div>
            </div>
          </div>
          <div class="detail-footer">
            <button mat-button class="back-btn" (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              Volver a la lista
            </button>
            <button mat-raised-button color="primary" (click)="goToMap()">
              <mat-icon>map</mat-icon>
              Ver en mapa
            </button>
            <button *ngIf="reportDetail.estado === 'APROBADO' || reportDetail.estado === 'validado'" mat-raised-button style="background-color: #ff9800; color: white;" (click)="followTruck()">
              <mat-icon>local_shipping</mat-icon>
              Seguir
            </button>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .container {
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

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .admin-button {
      color: #2e7d32;
      background: rgba(46, 125, 50, 0.1);
      border-radius: 50%;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(46, 125, 50, 0.2);
        transform: scale(1.05);
      }
    }

    .title {
      text-align: center;
      font-size: 2rem;
      font-weight: 700;
      color: #2e7d32;
      margin: 2rem 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .main-content {
      padding: 0 2rem 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;

      p {
        margin-top: 1rem;
        color: #666;
        font-size: 1.1rem;
      }
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

      mat-icon {
        font-size: 4rem;
        width: 4rem;
        height: 4rem;
        color: #f44336;
        margin-bottom: 1rem;
      }

      h3 {
        color: #333;
        margin-bottom: 0.5rem;
      }

      p {
        color: #666;
        margin-bottom: 2rem;
      }
    }

    .detail-card {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
      overflow: hidden;
      margin-top: 2rem;
    }

    .detail-header {
      padding: 2rem;
      background: linear-gradient(135deg, #2e7d32 0%, #388e3c 100%);
      color: white;
      border-radius: 16px 16px 0 0;
      margin-bottom: 0;
    }

    .report-info h2 {
      margin: 0 0 1rem 0;
      font-size: 1.8rem;
      font-weight: 600;
    }

    .report-meta {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 0.5rem;
    }

    .report-id {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .report-status {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.95rem;
      font-weight: 600;
      border-radius: 20px;
      padding: 0.25rem 0.75rem;
      background: #e2e3e5;
      color: #383d41;
      transition: background 0.2s, color 0.2s;
    }

    .detail-content {
      padding: 2rem;
    }

    .detail-section {
      margin-bottom: 2rem;

      h3 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #2e7d32;
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #e8f5e8;

        mat-icon {
          color: #4caf50;
        }
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .info-item {
      label {
        display: block;
        color: #666;
        font-size: 0.9rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
      }

      p {
        margin: 0;
        color: #333;
        font-size: 1rem;
        padding: 0.75rem;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #4caf50;
      }

      .anonymous-user {
        color: #666 !important;
        font-style: italic;
        border-left: 4px solid #ff9800 !important;
        background: #fff3e0 !important;
      }
    }

    .description {
      line-height: 1.6;
      color: #333;
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 12px;
      border-left: 4px solid #4caf50;
      margin: 0;
    }

    .image-container {
      text-align: center;
    }

    .report-image {
      max-width: 100%;
      max-height: 400px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.02);
      }
    }

    .admin-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;

      button {
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        border-radius: 8px;
        transition: all 0.3s ease;
        white-space: nowrap;

        mat-icon {
          margin-right: 0.5rem;
        }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    }

    .detail-footer {
      padding: 1.5rem 2rem;
      background: #f8f9fa;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .back-btn {
      color: #666;
      
      mat-icon {
        margin-right: 0.5rem;
      }
    }

    /* Status Classes */
    .status-pending {
      background: #fff3cd;
      color: #856404;
    }

    .status-approved {
      background: #d4edda;
      color: #155724;
    }

    .status-rejected {
      background: #f8d7da;
      color: #721c24;
    }

    .status-review {
      background: #d1ecf1;
      color: #0c5460;
    }

    .status-completed {
      background: #d4edda;
      color: #155724;
      border: 2px solid #28a745;
      font-weight: 600;
    }

    .status-default {
      background: #e2e3e5;
      color: #383d41;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .header {
        padding: 1rem;
      }

      .title {
        font-size: 1.5rem;
        margin: 1rem 0;
      }

      .main-content {
        padding: 0 1rem 1rem;
      }

      .detail-header,
      .detail-content {
        padding: 1.5rem;
      }

      .detail-footer {
        padding: 1rem;
        flex-direction: column;
        align-items: stretch;

        button {
          width: 100%;
        }
      }

      .admin-actions {
        flex-direction: column;

        button {
          min-width: auto;
        }
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ReportDetailComponent implements OnInit {
  reportDetail: ReporteDetailDTO | null = null;
  isLoading = false;
  isAdmin = false;
  reportId: string | null = null;
  token: string | undefined = undefined;

  constructor(
    private reporteService: ReporteService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private auth: Auth,
    private dialog: MatDialog,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.reportId = this.route.snapshot.paramMap.get('id');
    this.token = this.auth.obtenerToken() || undefined;
    this.checkUserRole();
    if (this.reportId) {
      this.cargarDetalleReporte();
    } else {
      this.mostrarError('ID de reporte no válido');
      this.router.navigate(['/reports']);
    }
  }

  checkUserRole() {
    // Usar validación real de admin
    this.isAdmin = this.auth.esAdmin();
    
    console.log('isAdmin:', this.isAdmin);
    console.log('Token:', this.auth.obtenerToken());
    console.log('User data:', this.auth.obtenerDatosUsuario());
    console.log('Is authenticated:', this.auth.estaAutenticado());
  }

  cargarDetalleReporte() {
    if (!this.reportId) return;
    this.isLoading = true;
    this.reporteService.obtenerDetalleReporte(Number(this.reportId), this.token!).subscribe({
      next: (response) => {
        this.reportDetail = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar detalle del reporte:', error);
        this.isLoading = false;
        this.mostrarError('Error al cargar el detalle del reporte');
      }
    });
  }

  approveReport() {
    if (!this.reportId || !this.reportDetail || !this.token) return;
    this.reporteService.actualizarEstadoReporte(Number(this.reportId), 'validado', this.token!).subscribe({
      next: () => {
        this.reportDetail!.estado = 'validado';
        this.mostrarMensaje('Reporte aprobado exitosamente');
      },
      error: (error) => {
        console.error('Error al aprobar reporte:', error);
        this.mostrarError('Error al aprobar el reporte');
      }
    });
  }

  rejectReport() {
    if (!this.reportId || !this.reportDetail || !this.token) return;
    this.reporteService.actualizarEstadoReporte(Number(this.reportId), 'rechazado', this.token!).subscribe({
      next: () => {
        this.reportDetail!.estado = 'rechazado';
        this.mostrarMensaje('Reporte rechazado');
      },
      error: (error) => {
        console.error('Error al rechazar reporte:', error);
        this.mostrarError('Error al rechazar el reporte');
      }
    });
  }

  goBack() {
    this.router.navigate(['/reports']);
  }

  goToMap() {
    // Navegar al mapa con las coordenadas del reporte si están disponibles
    if (this.reportDetail && this.reportDetail.latitud && this.reportDetail.longitud) {
      this.router.navigate(['/map'], {
        queryParams: {
          showReport: 'true',
          reportLat: this.reportDetail.latitud,
          reportLng: this.reportDetail.longitud,
          reportId: this.reportDetail.idReporte,
          reportTitle: this.reportDetail.titulo
        }
      });
    } else {
      this.router.navigate(['/map']);
    }
  }

  followTruck() {
    if (!this.reportDetail || !this.reportDetail.latitud || !this.reportDetail.longitud) {
      this.mostrarError('No se pueden obtener las coordenadas del reporte');
      return;
    }

    // Coordenadas de partida del camión de basura
    const startLat = -8.082300478046495;
    const startLng = -79.04119366686191;
    
    // Coordenadas de destino (ubicación del reporte)
    const endLat = this.reportDetail.latitud;
    const endLng = this.reportDetail.longitud;

    // Navegar al mapa con parámetros de seguimiento
    this.router.navigate(['/map'], {
      queryParams: {
        followTruck: 'true',
        startLat: startLat,
        startLng: startLng,
        endLat: endLat,
        endLng: endLng,
        reportId: this.reportDetail.idReporte
      }
    });
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  getStatusText(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'validado': return 'Aprobado';
      case 'rechazado': return 'Rechazado';
      case 'resuelto': return 'Resuelto';
      case 'cancelado': return 'Cancelado';
      case 'completado': return 'Completado';
      case 'PENDIENTE': return 'Pendiente';
      case 'APROBADO': return 'Aprobado';
      case 'RECHAZADO': return 'Rechazado';
      case 'EN_REVISION': return 'En Revisión';
      case 'COMPLETADO': return 'Completado';
      default: return estado;
    }
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'status-pending';
      case 'validado': return 'status-approved';
      case 'rechazado': return 'status-rejected';
      case 'resuelto': return 'status-approved';
      case 'cancelado': return 'status-rejected';
      case 'completado': return 'status-completed';
      case 'PENDIENTE': return 'status-pending';
      case 'APROBADO': return 'status-approved';
      case 'RECHAZADO': return 'status-rejected';
      case 'EN_REVISION': return 'status-review';
      case 'COMPLETADO': return 'status-completed';
      default: return 'status-default';
    }
  }

  onImageError(event: any) {
    event.target.style.display = 'none';
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

  // Método para denunciar reporte
  reportReport() {
    if (!this.reportDetail || !this.token || !this.reportId) return;

    // Verificar si el reporte es anónimo
    if (this.reportDetail.esAnonimo || !this.reportDetail.correoUsuario) {
      this.mostrarError('No se puede banear al usuario de un reporte anónimo.');
      return;
    }

    const confirmDialog = confirm('¿Estás seguro de que quieres denunciar este reporte? Esta acción baneará la cuenta del usuario que lo creó por incumplir las NORMAS y rechazará automáticamente el reporte.');
    
    if (confirmDialog) {
      // Primero banear al usuario que creó el reporte
      this.userService.banearUsuarioPorCorreo(this.token!, this.reportDetail.correoUsuario).subscribe({
        next: () => {
          // Después de banear exitosamente, rechazar el reporte automáticamente
          this.reporteService.actualizarEstadoReporte(Number(this.reportId), 'rechazado', this.token!).subscribe({
            next: () => {
              this.reportDetail!.estado = 'rechazado';
              this.mostrarMensaje('Reporte denunciado exitosamente. La cuenta del usuario ha sido baneada por incumplir las NORMAS y el reporte ha sido rechazado automáticamente.');
            },
            error: (error) => {
              console.error('Error al rechazar reporte:', error);
              this.mostrarError('Usuario baneado, pero hubo un error al rechazar el reporte automáticamente.');
            }
          });
        },
        error: (error) => {
          console.error('Error al banear usuario:', error);
          let mensajeError = 'Error al banear el usuario. Inténtalo de nuevo.';
          
          if (error.status === 403) {
            // Error 403: Usuario ya está baneado u operación no permitida
            if (error.error?.message) {
              mensajeError = error.error.message;
            } else {
              mensajeError = 'El usuario ya está baneado o la operación no está permitida.';
            }
          } else if (error.status === 404) {
            // Error 404: Usuario no encontrado
            mensajeError = 'Usuario no encontrado. Es posible que ya haya sido eliminado.';
          } else if (error.status === 500) {
            // Error 500: Error interno del servidor
            mensajeError = 'Error interno del servidor. Por favor, contacta al administrador.';
          } else if (error.status === 0) {
            // Error de conexión
            mensajeError = 'No se puede conectar con el servidor. Verifica tu conexión.';
          }
          
          this.mostrarError(mensajeError);
        }
      });
    }
  }

  // Método para descargar reporte como PDF
  async downloadReportAsPDF() {
    if (!this.reportDetail) return;

    try {
      const doc = new jsPDF();
      
      // Configurar fuente
      doc.setFont('helvetica');
      
      // Constantes para paginación
      const pageHeight = 297; // A4 height in mm
      const marginBottom = 30; // Espacio para pie de página
      const maxY = pageHeight - marginBottom;
      
      // Función para verificar si necesita nueva página
      const checkNewPage = (currentY: number, requiredSpace: number) => {
        if (currentY + requiredSpace > maxY) {
          doc.addPage();
          return 30; // Reiniciar Y position en nueva página
        }
        return currentY;
      };
      
      // Función para agregar pie de página
      const addFooter = () => {
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text('Generado por EcoAlerta - Sistema de Reportes Ambientales', 20, pageHeight - 20);
          doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, pageHeight - 10);
          doc.text(`Página ${i} de ${pageCount}`, 170, pageHeight - 10);
        }
      };
      
      // Título
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Reporte de Incidente Ambiental', 20, 30);
      
      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);
      
      // Información del reporte
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      
      let yPosition = 50;
      const lineHeight = 8;
      
      // ID del reporte
      yPosition = checkNewPage(yPosition, lineHeight);
      doc.setFont('helvetica', 'bold');
      doc.text('ID del Reporte:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(this.reportDetail.idReporte.toString(), 70, yPosition);
      yPosition += lineHeight;
      
      // Título
      const titleLines = doc.splitTextToSize(this.reportDetail.titulo, 120);
      yPosition = checkNewPage(yPosition, titleLines.length * lineHeight);
      doc.setFont('helvetica', 'bold');
      doc.text('Título:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(titleLines, 70, yPosition);
      yPosition += titleLines.length * lineHeight;
      
      // Estado
      yPosition = checkNewPage(yPosition, lineHeight);
      doc.setFont('helvetica', 'bold');
      doc.text('Estado:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(this.getStatusText(this.reportDetail.estado), 70, yPosition);
      yPosition += lineHeight;
      
      // Fecha de creación
      yPosition = checkNewPage(yPosition, lineHeight * 2);
      doc.setFont('helvetica', 'bold');
      doc.text('Fecha de Reporte:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(this.formatDate(this.reportDetail.fechaReporte), 70, yPosition);
      yPosition += lineHeight * 2;
      
      // Sección de información del usuario
      yPosition = checkNewPage(yPosition, lineHeight * 3);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('INFORMACIÓN DEL REPORTANTE', 20, yPosition);
      yPosition += lineHeight;
      doc.setLineWidth(0.3);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += lineHeight;
      
      doc.setFontSize(12);
      if (this.reportDetail.esAnonimo) {
        yPosition = checkNewPage(yPosition, lineHeight);
        doc.setFont('helvetica', 'bold');
        doc.text('Tipo de Reporte:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text('Anónimo', 70, yPosition);
        yPosition += lineHeight;
      } else {
        yPosition = checkNewPage(yPosition, lineHeight * 2);
        doc.setFont('helvetica', 'bold');
        doc.text('Nombre:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(this.reportDetail.nombreUsuario || 'No disponible', 70, yPosition);
        yPosition += lineHeight;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Correo:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(this.reportDetail.correoUsuario || 'No disponible', 70, yPosition);
        yPosition += lineHeight;
      }
      yPosition += lineHeight;
      
      // Sección de ubicación
      yPosition = checkNewPage(yPosition, lineHeight * 3);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('INFORMACIÓN DE UBICACIÓN', 20, yPosition);
      yPosition += lineHeight;
      doc.setLineWidth(0.3);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += lineHeight;
      
      doc.setFontSize(12);
      // Ubigeo
      if (this.reportDetail.departamento) {
        yPosition = checkNewPage(yPosition, lineHeight * 3);
        doc.setFont('helvetica', 'bold');
        doc.text('Departamento:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(this.reportDetail.departamento, 70, yPosition);
        yPosition += lineHeight;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Provincia:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(this.reportDetail.provincia || 'No disponible', 70, yPosition);
        yPosition += lineHeight;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Distrito:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(this.reportDetail.distrito || 'No disponible', 70, yPosition);
        yPosition += lineHeight;
      }
      
      // Dirección
      if (this.reportDetail.direccion) {
        const addressLines = doc.splitTextToSize(this.reportDetail.direccion, 120);
        yPosition = checkNewPage(yPosition, addressLines.length * lineHeight);
        doc.setFont('helvetica', 'bold');
        doc.text('Dirección:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(addressLines, 70, yPosition);
        yPosition += addressLines.length * lineHeight;
      }
      
      // Referencia
      if (this.reportDetail.referencia) {
        const refLines = doc.splitTextToSize(this.reportDetail.referencia, 120);
        yPosition = checkNewPage(yPosition, refLines.length * lineHeight);
        doc.setFont('helvetica', 'bold');
        doc.text('Referencia:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(refLines, 70, yPosition);
        yPosition += refLines.length * lineHeight;
      }
      
      // Coordenadas
      if (this.reportDetail.latitud && this.reportDetail.longitud) {
        yPosition = checkNewPage(yPosition, lineHeight);
        doc.setFont('helvetica', 'bold');
        doc.text('Coordenadas:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(`Lat: ${this.reportDetail.latitud.toFixed(6)}, Lng: ${this.reportDetail.longitud.toFixed(6)}`, 70, yPosition);
        yPosition += lineHeight;
      }
      yPosition += lineHeight;
      
      // Descripción
      const descriptionLines = doc.splitTextToSize(this.reportDetail.descripcion, 170);
      yPosition = checkNewPage(yPosition, lineHeight * 3 + descriptionLines.length * lineHeight);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('DESCRIPCIÓN DEL INCIDENTE', 20, yPosition);
      yPosition += lineHeight;
      doc.setLineWidth(0.3);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += lineHeight;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(descriptionLines, 20, yPosition);
      yPosition += descriptionLines.length * lineHeight + 10;
      
      // Agregar imagen si existe
      if (this.reportDetail.imagenUrl) {
        try {
          // Cargar la imagen
          const imageData = await this.loadImageAsBase64(this.reportDetail.imagenUrl);
          
          // Calcular dimensiones para la imagen (mantener aspecto)
          const maxWidth = 170;
          const maxHeight = 120;
          
          // Verificar si necesita nueva página para la imagen
          yPosition = checkNewPage(yPosition, lineHeight + maxHeight + 10);
          
          // Agregar título de la imagen
          doc.setFont('helvetica', 'bold');
          doc.text('Evidencia Fotográfica:', 20, yPosition);
          yPosition += lineHeight;
          
          // Agregar la imagen al PDF
          doc.addImage(imageData, 'JPEG', 20, yPosition, maxWidth, maxHeight);
          yPosition += maxHeight + 10;
          
        } catch (imageError) {
          console.warn('No se pudo cargar la imagen para el PDF:', imageError);
          // Continuar sin la imagen
          yPosition = checkNewPage(yPosition, lineHeight * 2);
          doc.setFont('helvetica', 'bold');
          doc.text('Evidencia Fotográfica:', 20, yPosition);
          yPosition += lineHeight;
          doc.setFont('helvetica', 'normal');
          doc.text('(Imagen no disponible)', 20, yPosition);
          yPosition += lineHeight + 10;
        }
      }
      
      // Agregar pie de página a todas las páginas
      addFooter();
      
      // Guardar el PDF
      const fileName = `reporte_${this.reportDetail.idReporte}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      this.mostrarMensaje('PDF descargado exitosamente con paginación automática');
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.mostrarError('Error al generar el PDF');
    }
  }

  // Método auxiliar para cargar imagen como base64
  private loadImageAsBase64(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('No se pudo crear el contexto del canvas'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        try {
          const dataURL = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataURL);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };
      
      img.src = imageUrl;
    });
  }
}
