import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import * as L from 'leaflet';
import { GeoService } from '../services/geo.service';
import { ReporteService, ReporteListDTO, RespuestaJsend } from '../services/backend/reporte.service';
import { NotificationService, Notification } from '../services/notification.service';
import { Auth } from '../services/backend/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatSnackBarModule,
    RouterModule,
    HttpClientModule
],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private map: L.Map | undefined;
  private districtLayer: L.GeoJSON | undefined;
  estaLogueado = false;
  loading = false;
  errorMsg = '';
  reportes: ReporteListDTO[] = [];
  nombreUsuario = '';
  notifications: Notification[] = [];
  unreadNotificationsCount = 0;
  isAdmin = false;
  
  // Propiedades para simulación de camiones
  private truckMarkers: L.Marker[] = [];
  private simulationRunning = false;
  private truckRoutes = {
    startPoint: [-8.082300478046495, -79.04119366686191],
    wasteDisposal: [-8.076757, -79.068174],
    destinations: [
      [-8.067452, -79.061716], // ejemplo1
      [-8.065019, -79.037704], // ejemplo2
      [-8.049414, -79.054163]  // ejemplo3
    ]
  };

  constructor(
    private router: Router,
    private geoService: GeoService,
    private reporteService: ReporteService,
    private notificationService: NotificationService,
    private auth: Auth,
    private snackBar: MatSnackBar
  ) {
    this.verificarLogin();
  }

  ngOnInit() {
    this.initializeMap();
    this.cargarNotificaciones();
    this.loading = true;
    
    // Obtener token si el usuario está autenticado
    const token = this.estaLogueado ? this.auth.obtenerToken() : undefined;
    
    this.reporteService.listarReportes(token || undefined).subscribe({
      next: (resp: RespuestaJsend<ReporteListDTO[]>) => {
        if (resp.status === 'success' && resp.data) {
          this.reportes = resp.data;
        } else {
          this.errorMsg = resp.message || 'No se pudieron cargar los reportes';
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.errorMsg = 'Error al cargar la lista';
        this.loading = false;
      }
    });
    
    // Iniciar simulación de camiones después de 3 segundos
    setTimeout(() => {
      this.startTruckSimulation();
    }, 3000);
  }

  verificarLogin() {
    this.estaLogueado = this.auth.estaAutenticado();
    if (this.estaLogueado) {
      this.nombreUsuario = this.auth.obtenerNombreUsuario();
      this.isAdmin = this.auth.esAdmin();
    }
  }

  cerrarSesion() {
    this.auth.cerrarSesion();
    this.estaLogueado = false;
    this.nombreUsuario = '';
    this.isAdmin = false;
    this.router.navigate(['/']);
  }

  cargarNotificaciones() {
    if (this.estaLogueado) {
      this.notificationService.getNotifications(this.isAdmin).then(notifications => {
        this.notifications = notifications;
        this.unreadNotificationsCount = notifications.filter(n => !n.leido).length;
      });
    }
  }

  markAsRead(notificationId: number) {
    this.notificationService.markAsRead(notificationId).then(() => {
      this.notifications = this.notifications.map(n => 
        n.id === notificationId ? { ...n, leido: true } : n
      );
      this.unreadNotificationsCount--;
    });
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().then(() => {
      this.notifications = this.notifications.map(n => ({ ...n, leido: true }));
      this.unreadNotificationsCount = 0;
    });
  }

  getTimeAgo(fecha: string): string {
    return this.notificationService.getTimeAgo(fecha);
  }

  trackById(index: number, item: ReporteListDTO): number {
    return item.idReporte;
  }

  irAPerfil() {
    this.router.navigate(['/profile']); // ajusta según tu routing
  }

  irAReportes() {
    this.router.navigate(['/reports']);
  }

  irADashboard() {
    this.router.navigate(['/admin']); // ajusta según tu routing para el panel de admin
  }

  irAAdminPanel() {
    this.router.navigate(['/admin-dashboard']);
  }

  // Método para configurar token manualmente (útil para desarrollo/testing)
  configurarTokenAdmin() {
    // Usar las credenciales del admin por defecto para obtener un token válido
    const loginData = {
      correo: 'admin@darkhub.lat',
      contrasena: 'admin1234'
    };
    
    this.auth.login(loginData).subscribe({
      next: (respuesta) => {
        if (respuesta.status === 'success' && respuesta.data) {
          this.auth.guardarToken(respuesta.data.token, respuesta.data, true);
          this.verificarLogin();
          console.log('Token de admin configurado exitosamente');
          this.snackBar.open('Sesión de admin iniciada correctamente', 'Cerrar', { duration: 3000 });
        } else {
          console.error('Error en login de admin:', respuesta.message);
          this.snackBar.open('Error al iniciar sesión de admin', 'Cerrar', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error al hacer login de admin:', error);
        this.snackBar.open('Error de conexión al iniciar sesión de admin', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private initializeMap() {
    // Crear el mapa centrado inicialmente en La Esperanza
    this.map = L.map('map').setView([-8.0685, -79.0445], 15);

    // Añadir capa base de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Cargar los límites exactos de La Esperanza
    this.geoService.getBoundary('La Esperanza Trujillo Peru').subscribe({
      next: (geojson: any) => {
        this.districtLayer = L.geoJSON(geojson, {
          style: {
            color: '#2e7d32',
            weight: 3,
            fillColor: '#4caf50',
            fillOpacity: 0.15,
            dashArray: '5, 5'
          }
        }).addTo(this.map!);

        // Ajustar vista y límites
        const bounds = this.districtLayer.getBounds().pad(0.1);
        this.map!.fitBounds(bounds);
        this.map!.setMaxBounds(bounds);
        this.map!.setMinZoom(14);
      },
      error: (error) => {
        console.error('Error loading boundary:', error);
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToReport() {
    this.router.navigate(['/create-report']);
  }

  goToMapView() {
    this.router.navigate(['/map']);
  }
  
  // Métodos para simulación de camiones
  private createTruckIcon(color: string): L.DivIcon {
    return L.divIcon({
      html: `<div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 4px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        font-weight: bold;
      ">🚛</div>`,
      className: 'truck-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  }
  
  private startTruckSimulation() {
    if (this.simulationRunning || !this.map) return;
    
    this.simulationRunning = true;
    
    // Crear 3 camiones con diferentes colores
    const truckColors = ['#ff5722', '#2196f3', '#4caf50'];
    
    // Limpiar marcadores anteriores
    this.truckMarkers.forEach(marker => this.map!.removeLayer(marker));
    this.truckMarkers = [];
    
    // Crear marcadores de camiones en el punto de partida
    for (let i = 0; i < 3; i++) {
      const truck = L.marker(
        [this.truckRoutes.startPoint[0], this.truckRoutes.startPoint[1]] as [number, number],
        { icon: this.createTruckIcon(truckColors[i]) }
      ).addTo(this.map!);
      
      this.truckMarkers.push(truck);
    }
    
    // Iniciar movimiento después de 1 segundo
    setTimeout(() => {
      this.moveTrucksToDestinations();
    }, 1000);
  }
  
  private moveTrucksToDestinations() {
    if (!this.map) return;
    
    // Mover cada camión a su destino correspondiente
    this.truckMarkers.forEach((truck, index) => {
      const destination = this.truckRoutes.destinations[index];
      this.animateMarker(truck, destination, 3000, () => {
        // Después de llegar al destino, ir al punto de disposición
        setTimeout(() => {
          this.animateMarker(truck, this.truckRoutes.wasteDisposal, 2000, () => {
            // Después de dejar la basura, volver al punto de partida
            setTimeout(() => {
              this.animateMarker(truck, this.truckRoutes.startPoint, 2000, () => {
                // Verificar si todos los camiones han terminado
                this.checkSimulationComplete();
              });
            }, 1000);
          });
        }, 1500);
      });
    });
  }
  
  private animateMarker(marker: L.Marker, destination: number[], duration: number, callback?: () => void) {
    const startLatLng = marker.getLatLng();
    const endLatLng = L.latLng(destination[0], destination[1]);
    
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Interpolación lineal
      const lat = startLatLng.lat + (endLatLng.lat - startLatLng.lat) * progress;
      const lng = startLatLng.lng + (endLatLng.lng - startLatLng.lng) * progress;
      
      marker.setLatLng([lat, lng]);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (callback) {
        callback();
      }
    };
    
    animate();
  }
  
  private checkSimulationComplete() {
    // Reiniciar la simulación después de 5 segundos
    setTimeout(() => {
      this.simulationRunning = false;
      this.startTruckSimulation();
    }, 5000);
  }
}
