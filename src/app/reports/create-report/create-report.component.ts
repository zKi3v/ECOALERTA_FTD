import { Component, ViewChild, ElementRef, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';

import * as L from 'leaflet';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { ReporteService, CategoriaBackend } from '../../services/backend/reporte.service';
import { Auth } from '../../services/backend/auth.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { GeoService } from '../../services/geo.service';

@Component({
  selector: 'app-create-report',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    CommonModule,
    MatSelectModule,
    HttpClientModule,
    MatAutocompleteModule
  ],
  templateUrl: './create-report.component.html', 
  styleUrls: ['./create-report.component.scss']
})
export class CreateReportComponent implements OnInit, AfterViewInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  reportForm: FormGroup;
  private map!: L.Map;
  private marker!: L.Marker;
  private laEsperanzaLayer!: L.GeoJSON; // Para almacenar la capa de La Esperanza
  selectedImage: File | null = null;
  esAnonimo = true;
  ipAnonimo: string | null = null;
  categorias: CategoriaBackend[] = [];
  selectedImagePreview: string | null = null;
  addressSuggestions: any[] = [];
  showLocationWarning = false;
  locationWarningTimeout: any = null;
  listaUbigeos = [
    { id: 1, nombre: 'La Esperanza' },
  ];
  public locationVerified: boolean = false; // Nueva propiedad

  // --- NUEVAS PROPIEDADES PARA MANEJO DE CÁMARA ---
  cameraSupported: boolean = false;
  takingPhoto: boolean = false;
  cameraErrorMessage: string = '';

  constructor(
    private fb: FormBuilder, 
    public router: Router, // Cambiado a público
    private snackBar: MatSnackBar,
    private reporteService: ReporteService,
    private route: ActivatedRoute,
    private http: HttpClient,
    private geoService: GeoService,
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {
    this.reportForm = this.fb.group({
      distrito: [{ value: 'La Esperanza', disabled: true }],
      direccion: ['', Validators.required],
      referencia: ['', Validators.required],
      ubicacion: ['', Validators.required],
      latitud: [null, Validators.required],
      longitud: [null, Validators.required],
      ubigeoId: [1, Validators.required],
      titulo: ['', Validators.required],
      descripcion: ['', Validators.required],
      categoriaId: [null, Validators.required]
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnInit() {
  const token = this.auth.obtenerToken();
  this.esAnonimo = !token;

  if (this.esAnonimo) {
    this.reporteService.obtenerIpPublica().subscribe({
      next: (ipResp) => {
        this.ipAnonimo = ipResp.ip;
      },
      error: () => {
        this.snackBar.open('No se pudo obtener la IP pública', 'OK', { duration: 3000 });
      }
    });
  }

  // Primero cargamos categorías (y ubigeos los tienes fijos)
  this.reporteService.obtenerCategorias().subscribe({
    next: (resp) => {
      if (resp.status === 'success' && resp.data) {
        this.categorias = resp.data;

        // Luego aplicamos patchValue SOLO cuando ya tenemos las categorías
        this.route.queryParams.subscribe(params => {
          const patch: any = {};

          if (params['latitud'] && params['longitud']) {
            patch.latitud = parseFloat(params['latitud']);
            patch.longitud = parseFloat(params['longitud']);
            patch.ubicacion = params['ubicacion'] || `${params['latitud']}, ${params['longitud']}`;
          }

          ['titulo', 'descripcion', 'direccion', 'referencia'].forEach(campo => {
            if (params[campo]) {
              patch[campo] = params[campo];
            }
          });

          // Convertir ids a number para que seleccione bien en el <mat-select>
          if (params['categoriaId']) {
            patch.categoriaId = Number(params['categoriaId']);
          }
          if (params['ubigeoId']) {
            patch.ubigeoId = Number(params['ubigeoId']);
          }

          this.reportForm.patchValue(patch);
        });
      }
    },
    error: (err) => console.error('Error al cargar categorías:', err)
  });

  this.reportForm.get('direccion')?.valueChanges.pipe(
    debounceTime(500), // Espera 500ms después de que el usuario deja de escribir
    distinctUntilChanged(), // Solo emite si el valor ha cambiado
    switchMap(address => {
      if (address && address.length > 3) { // Realiza la búsqueda si la dirección tiene más de 3 caracteres
        return this.reporteService.buscarDireccion(address).pipe(
          catchError(() => EMPTY) // En caso de error, no hacer nada
        );
      } else {
        this.addressSuggestions = [];
        return EMPTY; // No hacer nada si la dirección es muy corta
      }
    })
  ).subscribe(suggestions => {
    this.addressSuggestions = suggestions;
  });

  // Detectar soporte de cámara
  this.cameraSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

  trackByIdCategoria(index: number, item: any): number {
  return item.idCategoria;
}

  triggerImageUpload() {
    this.fileInput.nativeElement.click();
  }

onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length === 1) {   // ⚠️ solo 1 archivo
    const file = input.files[0];
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (validTypes.includes(file.type)) {
      this.selectedImage = file;

      // Leer preview base64
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedImagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);

    } else {
      this.snackBar.open('Solo se permiten imágenes JPG, PNG o WEBP', 'OK', { duration: 3000 });
      this.selectedImage = null;
      this.selectedImagePreview = null;
    }
  } else {
    this.snackBar.open('Por favor selecciona solo una imagen', 'OK', { duration: 3000 });
    this.selectedImage = null;
    this.selectedImagePreview = null;
  }
}

  removeImage(event: Event) {
  event.stopPropagation();
  this.selectedImage = null;
  this.selectedImagePreview = null;
}

async takePhoto() {
  this.cameraErrorMessage = '';
  if (!this.cameraSupported) {
    this.cameraErrorMessage = 'El navegador no soporta acceso a la cámara.';
    this.snackBar.open(this.cameraErrorMessage, 'OK', { duration: 3000, panelClass: ['error-snackbar'] });
    return;
  }
  this.takingPhoto = true;
  try {
    const constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const video = document.createElement('video');
    video.srcObject = stream;
    video.style.display = 'none';
    document.body.appendChild(video);
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve(null);
      };
    });
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const blob = await new Promise<Blob>((resolve) => 
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9)
    );
    const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
    this.selectedImage = file;
    this.selectedImagePreview = URL.createObjectURL(file);
    stream.getTracks().forEach(track => track.stop());
    video.remove();
    canvas.remove();
    this.snackBar.open('¡Foto tomada exitosamente!', 'OK', { 
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  } catch (error: any) {
    let errorMessage = 'Error al acceder a la cámara.';
    if (error && error.name === 'NotAllowedError') {
      errorMessage = 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara.';
    } else if (error && error.name === 'NotFoundError') {
      errorMessage = 'No se encontró ninguna cámara conectada.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    this.cameraErrorMessage = errorMessage;
    this.snackBar.open(errorMessage, 'OK', { 
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  } finally {
    this.takingPhoto = false;
  }
}

private getAddress(lat: number, lng: number): void {
  this.reporteService.obtenerDireccion(lat, lng).subscribe({
    next: (response) => {
      if (response && response.display_name) {
        // Limpiar las sugerencias
        this.addressSuggestions = [];
        
        // Actualizar el campo de dirección usando setValue directamente
        const direccionControl = this.reportForm.get('direccion');
        if (direccionControl) {
          direccionControl.setValue(response.display_name);
          direccionControl.markAsTouched();
          direccionControl.markAsDirty();
        }
        
        // Forzar detección de cambios después de un pequeño delay
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);
      }
    },
    error: () => {
      this.snackBar.open('No se pudo obtener la dirección', 'OK', { duration: 3000 });
    }
  });
}

displayFn(suggestion: any): string {
  if (suggestion && suggestion.display_name) {
    // Truncar direcciones muy largas para mejor visualización
    const maxLength = 60;
    return suggestion.display_name.length > maxLength 
      ? suggestion.display_name.substring(0, maxLength) + '...'
      : suggestion.display_name;
  }
  return '';
}

onSuggestionSelected(event: any) {
  const selectedAddress = event.option.value;
  
  // SIEMPRE actualizar el campo de dirección primero
  this.addressSuggestions = [];
  
  const direccionControl = this.reportForm.get('direccion');
  if (direccionControl) {
    direccionControl.setValue(selectedAddress.display_name);
    direccionControl.markAsTouched();
    direccionControl.markAsDirty();
  }
  
  // Actualizar coordenadas
  this.reportForm.patchValue({
    latitud: selectedAddress.lat,
    longitud: selectedAddress.lon,
    ubicacion: `${selectedAddress.lat}, ${selectedAddress.lon}`
  });
  
  // Verificar si la ubicación está dentro de La Esperanza
  this.checkIfLocationIsInLaEsperanza(selectedAddress.lat, selectedAddress.lon, (isValid: boolean) => {
    if (!isValid) {
      this.showLocationWarning = true;
      this.setLocationVerified(false);
      // NO actualizar el mapa si está fuera de La Esperanza
    } else {
      // Si está dentro de La Esperanza, actualizar el mapa
      this.showLocationWarning = false;
      this.setLocationVerified(true);
      
      this.map.setView([selectedAddress.lat, selectedAddress.lon], 18);
      if (this.marker) {
        this.marker.setLatLng([selectedAddress.lat, selectedAddress.lon]);
      } else {
        this.marker = L.marker([selectedAddress.lat, selectedAddress.lon]).addTo(this.map);
      }
    }
  });
  
  // Forzar detección de cambios
  setTimeout(() => {
    this.cdr.detectChanges();
  }, 0);
}

private setLocationVerified(valid: boolean) {
  this.locationVerified = valid;
}

// Método para verificar si una ubicación está dentro de La Esperanza usando el GeoJSON
private checkIfLocationIsInLaEsperanza(lat: number, lng: number, callback: (isValid: boolean) => void): void {
  if (this.laEsperanzaLayer) {
    // Si ya tenemos la capa cargada, verificar directamente
    const point = L.latLng(lat, lng);
    let isInside = false;
    
    this.laEsperanzaLayer.eachLayer((layer: any) => {
      if (layer.feature && layer.feature.geometry) {
        // Usar el método de Leaflet para verificar si el punto está dentro del polígono
        const bounds = layer.getBounds();
        if (bounds.contains(point)) {
          // Verificación más precisa usando el polígono
          const polygon = layer.feature.geometry;
          if (this.isPointInPolygon(lat, lng, polygon)) {
            isInside = true;
          }
        }
      }
    });
    
    callback(isInside);
  } else {
    // Si no tenemos la capa, usar límites aproximados como fallback
    const laEsperanzaBounds = L.latLngBounds([-8.1, -79.07], [-8.05, -79.02]);
    const selectedLatLng = L.latLng(lat, lng);
    callback(laEsperanzaBounds.contains(selectedLatLng));
  }
}

// Método auxiliar para verificar si un punto está dentro de un polígono
private isPointInPolygon(lat: number, lng: number, polygon: any): boolean {
  if (polygon.type === 'Polygon') {
    return this.pointInPolygon([lng, lat], polygon.coordinates[0]);
  } else if (polygon.type === 'MultiPolygon') {
    for (const poly of polygon.coordinates) {
      if (this.pointInPolygon([lng, lat], poly[0])) {
        return true;
      }
    }
  }
  return false;
}

// Algoritmo ray casting para verificar si un punto está dentro de un polígono
private pointInPolygon(point: number[], polygon: number[][]): boolean {
  const x = point[0];
  const y = point[1];
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

private initMap(): void {
    this.map = L.map('minimap').setView([-8.0685, -79.0445], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Cargar los límites exactos de La Esperanza usando el mismo método que el home
    this.geoService.getBoundary('La Esperanza Trujillo Peru').subscribe({
      next: (geojson: any) => {
        this.laEsperanzaLayer = L.geoJSON(geojson, {
          style: {
            color: '#2e7d32',
            weight: 3,
            fillColor: '#4caf50',
            fillOpacity: 0.15,
            dashArray: '5, 5'
          }
        }).addTo(this.map!);

        // Ajustar vista y límites
        const bounds = this.laEsperanzaLayer.getBounds().pad(0.1);
        this.map!.fitBounds(bounds);
        this.map!.setMaxBounds(bounds);
        this.map!.setMinZoom(14);
      },
      error: (error) => {
        console.error('Error loading boundary:', error);
      }
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      
      // Usar la nueva validación más precisa
      this.checkIfLocationIsInLaEsperanza(lat, lng, (isValid) => {
        if (isValid) {
          if (this.marker) {
            this.marker.setLatLng(e.latlng);
          } else {
            this.marker = L.marker(e.latlng).addTo(this.map);
          }
          this.reportForm.patchValue({
            latitud: lat,
            longitud: lng,
            ubicacion: `${lat}, ${lng}`
          });
          this.getAddress(lat, lng);
          this.setLocationVerified(true); // Marcar ubicación como verificada
        } else {
          this.showLocationWarning = true;
          if (this.locationWarningTimeout) {
            clearTimeout(this.locationWarningTimeout);
          }
          this.locationWarningTimeout = setTimeout(() => {
            this.showLocationWarning = false;
          }, 2500);
        }
      });
    });

    // Custom control for geolocation
    const customControl = L.Control.extend({
      options: {
        position: 'topleft' 
      },
      onAdd: () => {
        const button = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom');
        button.innerHTML = '<i class="mat-icon notranslate material-icons mat-ligature-font">my_location</i>';
        button.onclick = () => this.geolocate();
        return button;
      }
    });

    this.map.addControl(new customControl());
  }

submitReport() {
  if (this.reportForm.valid) {
    const form = this.reportForm.value;
    const token = this.auth.obtenerToken();
    const esAnonimo = !token;

    const continuarEnvio = (imagenUrl: string) => {
      const dto = esAnonimo 
        ? { ...form, imagenUrl, ip: this.ipAnonimo } 
        : { ...form, imagenUrl };

      if (esAnonimo) {
        this.reporteService.crearReporteAnonimo(dto).subscribe({
          next: () => {
            // Calcular reportes restantes
            this.reporteService.contarReportesAnonimo(this.ipAnonimo!).subscribe({
              next: (resp) => {
                const cantidadActual = resp.status === 'success' ? (resp.data?.cantidadHoy ?? 0) : 0;
                const reportesRestantes = Math.max(0, 3 - cantidadActual);
                
                let mensaje = 'Reporte realizado exitosamente.';
                if (reportesRestantes > 0) {
                  mensaje += ` Te quedan ${reportesRestantes} ${reportesRestantes === 1 ? 'opción' : 'opciones'} más de reporte en este día.`;
                } else {
                  mensaje += ' Has alcanzado el límite de reportes por hoy.';
                }
                
                this.snackBar.open(mensaje, 'OK', { duration: 5000 });
                
                // Redirigir automáticamente a /home después de 2 segundos
                setTimeout(() => {
                  this.router.navigate(['/home']);
                }, 2000);
              },
              error: () => {
                this.snackBar.open('Reporte anónimo enviado correctamente', 'OK', { duration: 3000 });
                setTimeout(() => {
                  this.router.navigate(['/home']);
                }, 2000);
              }
            });
          },
          error: () => {
            this.snackBar.open('Error al enviar reporte anónimo', 'OK', { duration: 3000 });
          }
        });
      } else {
        this.reporteService.crearReporte(dto, token).subscribe({
          next: () => {
            this.snackBar.open('Reporte enviado correctamente', 'OK', { duration: 3000 });
            this.router.navigate(['/reports']);
          },
          error: () => {
            this.snackBar.open('Error al enviar el reporte', 'OK', { duration: 3000 });
          }
        });
      }
    };

    if (esAnonimo) {
      if (!this.ipAnonimo) {
        this.snackBar.open('No se pudo obtener la IP, intenta de nuevo', 'OK', { duration: 3000 });
        return;
      }

      // Primero verificar si la IP está bloqueada
      this.reporteService.verificarIpBloqueada(this.ipAnonimo).subscribe({
        next: (respBloqueo: boolean) => {
          // Si la respuesta es true, la IP está bloqueada
          if (respBloqueo) {
            this.snackBar.open('Tu IP está bloqueada hasta medianoche por exceder el límite de reportes anónimos', 'OK', { duration: 5000 });
            return;
          }

          // Si no está bloqueada, verificar el límite de reportes
           this.reporteService.contarReportesAnonimo(this.ipAnonimo!).subscribe({
        next: (resp) => {
          const cantidad = resp.status === 'success' ? (resp.data?.cantidadHoy ?? 0) : -1;

          if (cantidad >= 0 && cantidad < 3) {
            const enviar = (imagenUrl: string) => {
              continuarEnvio(imagenUrl);
            };

            if (this.selectedImage) {
              this.reporteService.subirImagen(this.selectedImage, esAnonimo).subscribe({
                next: (respImg) => {
                  if (respImg.status === 'success' && respImg.data?.nombreObjeto) {
                    enviar(respImg.data.nombreObjeto);
                  } else {
                    this.snackBar.open('Error al subir imagen', 'OK', { duration: 3000 });
                  }
                },
                error: () => {
                  this.snackBar.open('Error al subir imagen', 'OK', { duration: 3000 });
                }
              });
            } else {
              enviar('');
            }
          } else {
            this.snackBar.open('Has alcanzado el límite de 3 reportes anónimos por hoy', 'OK', { duration: 4000 });
          }
        },
            error: () => {
              this.snackBar.open('Error al verificar límite de reportes anónimos', 'OK', { duration: 3000 });
            }
          });
        },
        error: () => {
          this.snackBar.open('Error al verificar estado de IP', 'OK', { duration: 3000 });
        }
      });

    } else {
      if (this.selectedImage) {
        this.reporteService.subirImagen(this.selectedImage, esAnonimo).subscribe({
          next: (respImg) => {
            if (respImg.status === 'success' && respImg.data?.nombreObjeto) {
              continuarEnvio(respImg.data.nombreObjeto);
            } else {
              this.snackBar.open('Error al subir imagen', 'OK', { duration: 3000 });
            }
          },
          error: () => {
            this.snackBar.open('Error al subir imagen', 'OK', { duration: 3000 });
          }
        });
      } else {
        continuarEnvio('');
      }
    }
  } else {
    this.snackBar.open('Por favor, completa todos los campos requeridos.', 'OK', { duration: 3000 });
  }
}

geolocate(): void {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      this.map.setView([lat, lng], 18);
      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      } else {
        this.marker = L.marker([lat, lng]).addTo(this.map);
      }
      this.reportForm.patchValue({
        latitud: lat,
        longitud: lng,
        ubicacion: `${lat}, ${lng}`
      });
      this.getAddress(lat, lng);
    }, () => {
      this.snackBar.open('No se pudo obtener la ubicación', 'OK', { duration: 3000 });
    });
  } else {
    this.snackBar.open('Geolocalización no soportada por el navegador', 'OK', { duration: 3000 });
  }
}

  goBack() {
    this.router.navigate(['/home']);
  }

  irANormas() {
    this.router.navigate(['/normas']);
  }
}
