import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface CategoriaBackend {
  idCategoria: number;
  nombre: string;
  descripcion?: string;
}

export interface CrearReporteDTO {
  categoriaId: number;
  titulo: string;
  descripcion: string;
  direccion: string;
  referencia: string;
  latitud: number;
  longitud: number;
  imagenUrl: string;
  ubigeoId: number;
}

export interface CrearReporteAnonimoDTO {
  categoriaId: number;
  titulo: string;
  descripcion: string;
  direccion: string;
  referencia?: string;
  latitud: number;
  longitud: number;
  imagenUrl: string;
  ubigeoId: number;
  ip: string;
  userAgent: string;
}

export interface RespuestaJsend<T> {
  status: 'success' | 'fail' | 'error';
  data: T | null;
  message: string | null;
}

export interface ReporteListDTO {
  idReporte: number;
  titulo: string;
  latitud: number;
  longitud: number;
  estado: string;
}

export interface ReporteDetailDTO {
  idReporte: number;
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  estado: string;
  fechaReporte: string;
  
  // Información de ubicación
  direccion: string;
  referencia: string;
  latitud: number;
  longitud: number;
  
  // Información del usuario (puede ser null para reportes anónimos)
  nombreUsuario: string;
  correoUsuario: string;
  esAnonimo: boolean;
  
  // Información de ubigeo
  departamento: string;
  provincia: string;
  distrito: string;
}

export interface EstadoActualizarDTO {
  nuevoEstado: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private readonly apiUrl = 'http://localhost:5100';

  constructor(private http: HttpClient) {}

  obtenerCategorias(): Observable<RespuestaJsend<CategoriaBackend[]>> {
    return this.http.get<RespuestaJsend<CategoriaBackend[]>>(`${this.apiUrl}/categorias`);
  }

  crearReporte(dto: CrearReporteDTO, token: string): Observable<RespuestaJsend<any>> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.post<RespuestaJsend<any>>(`${this.apiUrl}/api/reportes`, dto, { headers });
  }

subirImagen(archivo: File, esAnonimo: boolean): Observable<RespuestaJsend<{ nombreObjeto: string; urlFirmada: string }>> {
  const formData = new FormData();
  formData.append('archivo', archivo);
  formData.append('esAnonimo', String(esAnonimo));

  return this.http.post<RespuestaJsend<{ nombreObjeto: string; urlFirmada: string }>>(
    `${this.apiUrl}/api/imagenes/subir`,
    formData
  );
}

  listarReportesAnonimos(): Observable<RespuestaJsend<ReporteListDTO[]>> {
    return this.http.get<RespuestaJsend<ReporteListDTO[]>>(
      `${this.apiUrl}/api/anonimo/reportes`
    );
  }

  obtenerIpPublica(): Observable<{ ip: string }> {
    return this.http.get<{ ip: string }>('https://api.ipify.org?format=json');
  }

  crearReporteAnonimo(dtoParcial: Omit<CrearReporteAnonimoDTO, 'ip' | 'userAgent'>): Observable<RespuestaJsend<void>> {
    return this.obtenerIpPublica().pipe(
      switchMap((ipResp: { ip: string }) => {
        const dto: CrearReporteAnonimoDTO = {
          ...dtoParcial,
          ip: ipResp.ip,
          userAgent: navigator.userAgent
        };
        return this.http.post<RespuestaJsend<void>>(`${this.apiUrl}/api/anonimo/reportes`, dto);
      })
    );
  }

contarReportesAnonimo(ip: string): Observable<RespuestaJsend<{ ipAddress: string, cantidadHoy: number }>> {
  return this.http.get<RespuestaJsend<{ ipAddress: string, cantidadHoy: number }>>(
    `${this.apiUrl}/api/anonimo/reportes/cantidad/${ip}`
  );
}

verificarIpBloqueada(ip: string): Observable<boolean> {
  return this.http.get<boolean>(`${this.apiUrl}/api/anonimo/ips-bloqueadas/${ip}`);
}

obtenerDireccion(lat: number, lng: number): Observable<any> {
  return this.http.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
}

buscarDireccion(direccion: string): Observable<any> {
  return this.http.get(`https://nominatim.openstreetmap.org/search?q=${direccion}&format=json&countrycodes=pe`);
}

// Nuevos métodos para la funcionalidad completa de reportes
listarReportes(token?: string): Observable<RespuestaJsend<ReporteListDTO[]>> {
  let options = {};
  if (token) {
    options = {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }
  return this.http.get<RespuestaJsend<ReporteListDTO[]>>(
    `${this.apiUrl}/api/reportes`,
    options
  );
}

obtenerDetalleReporte(id: number, token?: string): Observable<RespuestaJsend<ReporteDetailDTO>> {
  let options = {};
  if (token) {
    options = {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }
  return this.http.get<RespuestaJsend<ReporteDetailDTO>>(
    `${this.apiUrl}/api/reportes/${id}`,
    options
  );
}

actualizarEstadoReporte(id: number, nuevoEstado: string, token: string): Observable<RespuestaJsend<void>> {
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });
  const dto: EstadoActualizarDTO = { nuevoEstado };
  return this.http.put<RespuestaJsend<void>>(`${this.apiUrl}/api/reportes/${id}`, dto, { headers });
}

eliminarReporte(id: number, token: string): Observable<RespuestaJsend<void>> {
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });
  return this.http.delete<RespuestaJsend<void>>(`${this.apiUrl}/api/reportes/${id}`, { headers });
}
}
