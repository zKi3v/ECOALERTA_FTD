import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule, Router } from '@angular/router';
import { ReporteService, ReporteListDTO } from '../../services/backend/reporte.service';
import { Auth } from '../../services/backend/auth.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterModule,
    MatChipsModule,
    MatBadgeModule
  ],
  template: `
    <div class="admin-container">
      <!-- Header -->
      <div class="admin-header">
        <button mat-icon-button class="back-button" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          <span style="margin-left: 8px; font-weight: 600;">VOLVER</span>
        </button>
        <div class="admin-title">
          <mat-icon>admin_panel_settings</mat-icon>
          <h1>Panel de Administración</h1>
        </div>
        <div></div>
      </div>

      <!-- Dashboard Cards -->
      <div class="dashboard-cards">
        <mat-card class="stat-card pending">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon>pending</mat-icon>
              <div class="stat-info">
                <h3>{{reportesDenunciados.length}}</h3>
                <p>Reportes Pendientes</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card approved">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon>check_circle</mat-icon>
              <div class="stat-info">
                <h3>{{reportesAprobados.length}}</h3>
                <p>Reportes Aprobados</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card rejected">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon>cancel</mat-icon>
              <div class="stat-info">
                <h3>{{reportesRechazados.length}}</h3>
                <p>Reportes Rechazados</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card total">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon>assignment</mat-icon>
              <div class="stat-info">
                <h3>{{totalReportes}}</h3>
                <p>Total de Reportes</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Tabs for Reports -->
      <mat-card class="reports-section">
        <mat-tab-group>
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>pending</mat-icon>
              Pendientes
              <span class="tab-badge" [matBadge]="reportesDenunciados.length" matBadgeColor="warn"></span>
            </ng-template>
            <div class="tab-content">
              @if (isLoading) {
                <div class="loading-container">
                  <mat-progress-spinner diameter="50"></mat-progress-spinner>
                  <p>Cargando reportes...</p>
                </div>
              } @else {
                @if (reportesDenunciados.length === 0) {
                  <div class="empty-state">
                    <mat-icon>verified_user</mat-icon>
                    <h3>No hay reportes pendientes</h3>
                    <p>Todos los reportes han sido revisados</p>
                  </div>
                } @else {
                  <div class="reports-grid">
                    @for (reporte of reportesDenunciados; track reporte.idReporte) {
                       <mat-card class="report-card pending-card">
                        <mat-card-header>
                          <mat-card-title>{{reporte.titulo}}</mat-card-title>
                          <mat-chip class="status-chip pending">Pendiente</mat-chip>
                        </mat-card-header>
                        <mat-card-content>
                          <p><mat-icon>location_on</mat-icon> Lat: {{reporte.latitud}}, Lng: {{reporte.longitud}}</p>
                          <p><mat-icon>schedule</mat-icon> Esperando revisión</p>
                        </mat-card-content>
                        <mat-card-actions>
                          <button mat-raised-button color="primary" (click)="verDetalle(reporte.idReporte)">
                            <mat-icon>visibility</mat-icon>
                            Ver Detalles
                          </button>
                        </mat-card-actions>
                      </mat-card>
                    }
                  </div>
                }
              }
            </div>
          </mat-tab>

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>check_circle</mat-icon>
              Aprobados
              <span class="tab-badge" [matBadge]="reportesAprobados.length" matBadgeColor="primary"></span>
            </ng-template>
            <div class="tab-content">
              @if (reportesAprobados.length === 0) {
                <div class="empty-state">
                  <mat-icon>check_circle</mat-icon>
                  <h3>No hay reportes aprobados</h3>
                  <p>Aún no se han aprobado reportes</p>
                </div>
              } @else {
                <div class="reports-grid">
                  @for (reporte of reportesAprobados; track reporte.idReporte) {
                    <mat-card class="report-card approved-card">
                      <mat-card-header>
                        <mat-card-title>{{reporte.titulo}}</mat-card-title>
                        <mat-chip class="status-chip approved">Aprobado</mat-chip>
                      </mat-card-header>
                      <mat-card-content>
                        <p><mat-icon>location_on</mat-icon> Lat: {{reporte.latitud}}, Lng: {{reporte.longitud}}</p>
                        <p><mat-icon>check_circle</mat-icon> Reporte validado y aprobado</p>
                      </mat-card-content>
                      <mat-card-actions>
                        <button mat-raised-button color="primary" (click)="verDetalle(reporte.idReporte)">
                          <mat-icon>visibility</mat-icon>
                          Ver Detalles
                        </button>
                      </mat-card-actions>
                    </mat-card>
                  }
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>cancel</mat-icon>
              Rechazados
              <span class="tab-badge" [matBadge]="reportesRechazados.length" matBadgeColor="accent"></span>
            </ng-template>
            <div class="tab-content">
              @if (reportesRechazados.length === 0) {
                <div class="empty-state">
                  <mat-icon>cancel</mat-icon>
                  <h3>No hay reportes rechazados</h3>
                  <p>No se han rechazado reportes</p>
                </div>
              } @else {
                <div class="reports-grid">
                  @for (reporte of reportesRechazados; track reporte.idReporte) {
                    <mat-card class="report-card rejected-card">
                      <mat-card-header>
                        <mat-card-title>{{reporte.titulo}}</mat-card-title>
                        <mat-chip class="status-chip rejected">Rechazado</mat-chip>
                      </mat-card-header>
                      <mat-card-content>
                        <p><mat-icon>location_on</mat-icon> Lat: {{reporte.latitud}}, Lng: {{reporte.longitud}}</p>
                        <p><mat-icon>cancel</mat-icon> Reporte rechazado por el administrador</p>
                      </mat-card-content>
                      <mat-card-actions>
                        <button mat-raised-button color="primary" (click)="verDetalle(reporte.idReporte)">
                          <mat-icon>visibility</mat-icon>
                          Ver Detalles
                        </button>
                      </mat-card-actions>
                    </mat-card>
                  }
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>

      <!-- Quick Actions -->
      <mat-card class="quick-actions">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>flash_on</mat-icon>
            Acciones Rápidas
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="actions-grid">
            <button mat-raised-button color="primary" (click)="irAReportes()">
              <mat-icon>assignment</mat-icon>
              Ver Todos los Reportes
            </button>
            <button mat-raised-button color="accent" (click)="exportarReportes()">
              <mat-icon>download</mat-icon>
              Exportar Datos
            </button>
            <button mat-raised-button (click)="generarReporte()">
              <mat-icon>analytics</mat-icon>
              Generar Reporte
            </button>
            <button mat-raised-button (click)="configurarNotificaciones()">
              <mat-icon>notifications</mat-icon>
              Configurar Alertas
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  reportesDenunciados: ReporteListDTO[] = [];
  reportesAprobados: ReporteListDTO[] = [];
  reportesRechazados: ReporteListDTO[] = [];
  totalReportes: number = 0;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private reporteService: ReporteService,
    private auth: Auth,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarReportes();
  }

  cargarReportes(): void {
    this.isLoading = true;
    const token = this.auth.obtenerToken();
    
    if (!token) {
      this.mostrarError('No tienes permisos para acceder a esta sección');
      this.router.navigate(['/home']);
      return;
    }

    this.reporteService.listarReportes(token).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          // Debug: mostrar datos recibidos
          console.log('Datos recibidos en admin panel:', response.data);
          const reportes = response.data;
          this.reportesDenunciados = reportes.filter((r: any) => r.estado === 'pendiente');
          this.reportesAprobados = reportes.filter((r: any) => r.estado === 'validado' || r.estado === 'resuelto');
          this.reportesRechazados = reportes.filter((r: any) => r.estado === 'rechazado' || r.estado === 'cancelado');
          this.totalReportes = reportes.length;
          console.log('Reportes filtrados:', {
            pendientes: this.reportesDenunciados.length,
            aprobados: this.reportesAprobados.length,
            rechazados: this.reportesRechazados.length,
            total: this.totalReportes
          });
        } else {
          this.mostrarError('Error al cargar los reportes');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar reportes:', error);
        this.mostrarError('Error al conectar con el servidor');
        this.isLoading = false;
      }
    });
  }

  verDetalle(idReporte: number): void {
    this.router.navigate(['/reports', idReporte]);
  }

  irAReportes(): void {
    this.router.navigate(['/reports']);
  }

  exportarReportes(): void {
    this.snackBar.open('Función de exportación en desarrollo', 'OK', { duration: 3000 });
  }

  generarReporte(): void {
    this.snackBar.open('Función de reportes analíticos en desarrollo', 'OK', { duration: 3000 });
  }

  configurarNotificaciones(): void {
    this.snackBar.open('Configuración de notificaciones en desarrollo', 'OK', { duration: 3000 });
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}