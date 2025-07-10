import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule, Router } from '@angular/router';
import { ReporteService, ReporteListDTO } from '../../services/backend/reporte.service';
import { Auth } from '../../services/backend/auth.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.scss']
})
export class ReportListComponent implements OnInit {
  reports: ReporteListDTO[] = [];
  filteredReports: ReporteListDTO[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  
  mockReports = [
    {
      id: 1,
      date: '17 Jun 2025',
      reason: 'Acumulación de residuos',
      description: 'Gran cantidad de residuos acumulados en la esquina de la avenida principal.',
      location: 'Av. Principal, La Esperanza',
      status: 'pending'
    },
    {
      id: 2,
      date: '16 Jun 2025',
      reason: 'Contenedor dañado',
      description: 'El contenedor de residuos está roto y los desechos se están esparciendo.',
      location: 'Calle Las Flores, La Esperanza',
      status: 'approved'
    }
  ];

  constructor(
    public router: Router,
    private reporteService: ReporteService,
    private snackBar: MatSnackBar,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.cargarReportes();
  }

  cargarReportes(): void {
    this.isLoading = true;
    
    // Usar el servicio de autenticación mejorado
    const token = this.auth.obtenerToken();
    
    const observable = token ? 
      this.reporteService.listarReportes(token) : 
      this.reporteService.listarReportesAnonimos();
    
    observable.subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          // Mostrar todos los reportes temporalmente para debug
          console.log('Datos recibidos del backend:', response.data);
          // Temporalmente mostrar todos los reportes para debug
          this.reports = response.data;
          console.log('Total de reportes recibidos:', this.reports.length);
          if (this.reports.length > 0) {
            console.log('Estados de reportes:', this.reports.map(r => r.estado));
          }
          this.filteredReports = [...this.reports];
        } else {
          this.mostrarError('Error al cargar los reportes');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar reportes:', error);
        this.mostrarError('Error al conectar con el servidor');
        this.isLoading = false;
        // Usar datos mock como fallback
        this.usarDatosMock();
      }
    });
  }

  usarDatosMock(): void {
    // Convertir mockReports al formato esperado
    this.reports = this.mockReports.map(mock => ({
      idReporte: mock.id,
      titulo: mock.reason,
      latitud: -8.1116, // Coordenadas aproximadas de La Esperanza
      longitud: -79.0297,
      estado: mock.status === 'pending' ? 'pendiente' : mock.status === 'approved' ? 'validado' : 'pendiente'
    }));
    this.filteredReports = [...this.reports];
  }

  onSearchChange(): void {
    if (!this.searchTerm.trim()) {
      this.filteredReports = [...this.reports];
    } else {
      this.filteredReports = this.reports.filter(report =>
        report.titulo.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  viewReport(idReporte: number): void {
    this.router.navigate(["/reports", idReporte]);
  }

  crearNuevoReporte(): void {
    this.router.navigate(['/create-report']);
  }

  trackByReportId(index: number, report: ReporteListDTO): number {
    return report.idReporte;
  }

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'validado':
      case 'resuelto':
      case 'APROBADO':
        return 'status-approved';
      case 'pendiente':
      case 'PENDIENTE':
        return 'status-pending';
      case 'rechazado':
      case 'cancelado':
      case 'RECHAZADO':
        return 'status-rejected';
      default:
        return '';
    }
  }

  getStatusText(estado: string): string {
    switch (estado) {
      case 'validado':
      case 'APROBADO':
        return 'Aprobado';
      case 'resuelto':
        return 'Resuelto';
      case 'pendiente':
      case 'PENDIENTE':
        return 'Pendiente';
      case 'rechazado':
      case 'RECHAZADO':
        return 'Rechazado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return estado || '';
    }
  }
}
