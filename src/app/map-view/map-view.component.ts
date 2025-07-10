import { Component, OnInit, OnDestroy } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import * as L from 'leaflet';
import { GeoService } from '../services/geo.service';

import introJs from 'intro.js';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    HttpClientModule
],
  templateUrl: 'map-view.component.html',
  styleUrls: ['./map-view.component.scss']
})
export class MapViewComponent implements OnInit, OnDestroy {
  private map: L.Map | undefined;
  private districtLayer: L.GeoJSON | undefined;
  selectingLocation = false;
  showReportPopup = false;
  
  // Propiedades para seguimiento del camión
  private truckMarker: L.Marker | undefined;
  private routeLine: L.Polyline | undefined;
  private destinationMarker: L.Marker | undefined;
  private isFollowingTruck = false;
  private animationInterval: any;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private geoService: GeoService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.initializeMap();
    
    // Verificar si se debe seguir el camión
    this.route.queryParams.subscribe(params => {
      if (params['followTruck'] === 'true') {
        this.isFollowingTruck = true;
        this.showReportPopup = false; // No mostrar popup en modo seguimiento
        
        const startLat = parseFloat(params['startLat']);
        const startLng = parseFloat(params['startLng']);
        const endLat = parseFloat(params['endLat']);
        const endLng = parseFloat(params['endLng']);
        const reportId = params['reportId'];
        
        if (startLat && startLng && endLat && endLng) {
          setTimeout(() => {
            this.startTruckSimulation(startLat, startLng, endLat, endLng, reportId);
          }, 1000);
        }
      } else {
        // Solo mostrar el tutorial la primera vez si no está en modo seguimiento
        const tutorialVisto = localStorage.getItem('ecoalerta_tutorial_visto');
        if (!tutorialVisto) {
          setTimeout(() => {
            this.mostrarTutorial();
          }, 1000);
        }
        
        // Mostrar popup después de 3 segundos
        setTimeout(() => {
          this.showReportPopup = true;
        }, 3000);
      }
    });
  }

  mostrarTutorial() {
  introJs().setOptions({
    steps: [
      {
        element: '#btn-volver',
        intro: '<strong>⬅ Este botón</strong> te permite volver al menú principal.'
      },
      {
        element: '#btn-centrar',
        intro: '<strong>🧭 Este botón</strong> centra el mapa en La Esperanza.'
      },
      {
        element: '#btn-seleccionar',
        intro: '<strong>📍 Este botón</strong> activa el modo para seleccionar un punto en el mapa para tu reporte.'
      }
    ],
    nextLabel: 'Siguiente',
    prevLabel: 'Anterior',
    doneLabel: 'Entendido',
    tooltipClass: 'custom-intro-tooltip',
    showStepNumbers: false
  }).start();
}

  private initializeMap() {
    // Crear el mapa centrado inicialmente en La Esperanza
    this.map = L.map('fullmap', {
      zoomControl: false // quitar el zoom de top-left
    }).setView([-8.0685, -79.0445], 15);

    // Añadir el zoom en top-right
    L.control.zoom({ position: 'topright' }).addTo(this.map);

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
        this.snackBar.open(
          'Error al cargar los límites del distrito. Usando área aproximada.',
          'OK',
          { duration: 3000 }
        );
      }
    });

    // Configurar el manejador de clics
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.selectingLocation) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);

        const marker = L.marker(e.latlng, {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div class="marker-pin"></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          })
        }).addTo(this.map!);

        marker.bindPopup(`
          <div class="custom-popup">
            <h3>Ubicación Seleccionada</h3>
            <p>Latitud: ${lat}</p>
            <p>Longitud: ${lng}</p>
          </div>
        `).openPopup();
        
        this.snackBar.open(
  `Ubicación seleccionada: ${lat}, ${lng}`, 
  'Seleccionar',
  { duration: 5000 }
).onAction().subscribe(() => {
  // Obtener parámetros previos si existen
  const currentParams = new URLSearchParams(window.location.search);

  // Agregar latitud, longitud y ubicacion a los parámetros
  currentParams.set('latitud', lat);
  currentParams.set('longitud', lng);
  currentParams.set('ubicacion', `${lat}, ${lng}`);

  // Redirigir al formulario con todos los parámetros
  this.router.navigate(['/create-report'], {
    queryParams: Object.fromEntries(currentParams.entries())
  });
});
      }
    });
  }

  centerOnLaEsperanza() {
    if (this.districtLayer) {
      this.map?.fitBounds(this.districtLayer.getBounds());
    }
  }

  toggleLocationSelect() {
    this.selectingLocation = !this.selectingLocation;
    if (this.selectingLocation) {
      this.snackBar.open(
        'Haz clic en el mapa para seleccionar una ubicación', 
        'OK', 
        { duration: 3000 }
      );
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }
  
  closePopup() {
    this.showReportPopup = false;
  }
  
  goToCreateReport() {
    this.closePopup();
    this.router.navigate(['/create-report']);
  }

  // Método para iniciar la simulación del camión
  startTruckSimulation(startLat: number, startLng: number, endLat: number, endLng: number, reportId: string) {
    if (!this.map) return;

    // Crear icono personalizado para el camión
    const truckIcon = L.divIcon({
      className: 'truck-marker',
      html: `
        <div style="
          background: #ff9800;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 3px solid white;
        ">
          <span style="font-size: 20px;">🚛</span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    // Crear icono para el destino
    const destinationIcon = L.divIcon({
      className: 'destination-marker',
      html: `
        <div style="
          background: #f44336;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 3px solid white;
        ">
          <span style="font-size: 16px;">📍</span>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    // Crear marcador del camión en la posición inicial
    this.truckMarker = L.marker([startLat, startLng], { icon: truckIcon })
      .addTo(this.map)
      .bindPopup(`
        <div style="text-align: center;">
          <h3>🚛 Camión de Basura</h3>
          <p>Dirigiéndose al reporte #${reportId}</p>
          <p><strong>Estado:</strong> En camino</p>
        </div>
      `);

    // Crear marcador del destino
    this.destinationMarker = L.marker([endLat, endLng], { icon: destinationIcon })
      .addTo(this.map)
      .bindPopup(`
        <div style="text-align: center;">
          <h3>📍 Destino</h3>
          <p>Reporte #${reportId}</p>
          <p><strong>Ubicación:</strong> ${endLat.toFixed(6)}, ${endLng.toFixed(6)}</p>
        </div>
      `);

    // Crear línea de ruta
    this.routeLine = L.polyline([[startLat, startLng], [endLat, endLng]], {
      color: '#ff9800',
      weight: 4,
      opacity: 0.7,
      dashArray: '10, 10'
    }).addTo(this.map);

    // Ajustar vista para mostrar toda la ruta
    const bounds = L.latLngBounds([[startLat, startLng], [endLat, endLng]]);
    this.map.fitBounds(bounds.pad(0.1));

    // Mostrar mensaje de inicio
    this.snackBar.open(
      `🚛 Siguiendo camión hacia reporte #${reportId}`,
      'Cerrar',
      { duration: 5000 }
    );

    // Iniciar animación del movimiento
    this.animateTruck(startLat, startLng, endLat, endLng, reportId);
  }

  // Método para animar el movimiento del camión
  animateTruck(startLat: number, startLng: number, endLat: number, endLng: number, reportId: string) {
    if (!this.truckMarker) return;

    const totalSteps = 100; // Número de pasos para la animación
    const stepDuration = 200; // Duración de cada paso en milisegundos (muy lento)
    let currentStep = 0;

    const latStep = (endLat - startLat) / totalSteps;
    const lngStep = (endLng - startLng) / totalSteps;

    this.animationInterval = setInterval(() => {
      if (currentStep >= totalSteps) {
        // Llegó al destino
        clearInterval(this.animationInterval);
        this.onTruckArrived(reportId);
        return;
      }

      // Calcular nueva posición
      const newLat = startLat + (latStep * currentStep);
      const newLng = startLng + (lngStep * currentStep);

      // Actualizar posición del marcador
      this.truckMarker!.setLatLng([newLat, newLng]);

      // Actualizar popup con progreso
      const progress = Math.round((currentStep / totalSteps) * 100);
      this.truckMarker!.setPopupContent(`
        <div style="text-align: center;">
          <h3>🚛 Camión de Basura</h3>
          <p>Dirigiéndose al reporte #${reportId}</p>
          <p><strong>Progreso:</strong> ${progress}%</p>
          <div style="background: #e0e0e0; border-radius: 10px; overflow: hidden; margin: 5px 0;">
            <div style="background: #ff9800; height: 8px; width: ${progress}%; transition: width 0.3s;"></div>
          </div>
        </div>
      `);

      currentStep++;
    }, stepDuration);
  }

  // Método cuando el camión llega al destino
  onTruckArrived(reportId: string) {
    if (this.truckMarker) {
      this.truckMarker.setPopupContent(`
        <div style="text-align: center;">
          <h3>✅ Camión Llegó</h3>
          <p>Reporte #${reportId} atendido</p>
          <p><strong>Estado:</strong> Completado</p>
        </div>
      `).openPopup();
    }

    this.snackBar.open(
      `✅ El camión ha llegado al destino del reporte #${reportId}`,
      'Cerrar',
      { duration: 5000 }
    );
  }

  // Limpiar animación al destruir el componente
  ngOnDestroy() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
  }
}
