import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RespuestaJsend<T> {
  status: 'success' | 'fail' | 'error';
  data: T | null;
  message: string | null;
}

export interface JwtResponse {
  token: string;
  tipo: string;
  correo: string;
  rolPrincipal: string;
  roles: string[];
  nombreCompleto: string;
}

export interface RegistroRequest {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  telefono: string;
  direccion: string;
  idUbigeo: number;
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface RestablecerContrasenaRequest {
  correo: string;
  codigo: string;
  nuevaContrasena: string;
}

export interface ConfirmacionRequest {
  correo: string;
  codigo: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private readonly apiUrl = 'http://localhost:5100/auth';
  private readonly codigoUrl = 'http://localhost:5100/api/codigo';

  constructor(private http: HttpClient) { }

  registro(datos: RegistroRequest): Observable<RespuestaJsend<void>> {
    return this.http.post<RespuestaJsend<void>>(`${this.apiUrl}/registro`, datos);
  }

  login(datos: LoginRequest): Observable<RespuestaJsend<JwtResponse>> {
    return this.http.post<RespuestaJsend<JwtResponse>>(`${this.apiUrl}/login`, datos);
  }

  recuperarContrasena(correo: string): Observable<RespuestaJsend<void>> {
    const params = new HttpParams().set('correo', correo);
    return this.http.post<RespuestaJsend<void>>(`${this.apiUrl}/recuperar-contrasena`, null, { params });
  }

  restablecerContrasena(datos: RestablecerContrasenaRequest): Observable<RespuestaJsend<void>> {
    return this.http.post<RespuestaJsend<void>>(`${this.apiUrl}/restablecer-contrasena`, datos);
  }

  verificarCuenta(datos: ConfirmacionRequest): Observable<RespuestaJsend<void>> {
    return this.http.post<RespuestaJsend<void>>(`${this.apiUrl}/verificar-cuenta`, datos);
  }

  restablecerContrasenaConLink(datos: RestablecerContrasenaRequest): Observable<RespuestaJsend<void>> {
    return this.http.post<RespuestaJsend<void>>(`${this.apiUrl}/restablecer-contrasena-link`, datos);
  }

  reenviarCodigo(correo: string): Observable<RespuestaJsend<void>> {
    const params = new HttpParams().set('correo', correo);
    return this.http.post<RespuestaJsend<void>>(`${this.codigoUrl}/reenviar`, null, { params });
  }

  // Métodos para gestión de tokens y autenticación
  guardarToken(token: string, userData: JwtResponse, recordarme: boolean = false): void {
    const storage = recordarme ? localStorage : sessionStorage;
    storage.setItem('ecoalerta_token', token);
    storage.setItem('ecoalerta_userData', JSON.stringify(userData));
  }

  obtenerToken(): string | null {
    return localStorage.getItem('ecoalerta_token') || sessionStorage.getItem('ecoalerta_token');
  }

  obtenerDatosUsuario(): JwtResponse | null {
    const userData = localStorage.getItem('ecoalerta_userData') || sessionStorage.getItem('ecoalerta_userData');
    return userData ? JSON.parse(userData) : null;
  }

  estaAutenticado(): boolean {
    return this.obtenerToken() !== null;
  }

  esAdmin(): boolean {
    const userData = this.obtenerDatosUsuario();
    return userData ? userData.rolPrincipal === 'ADMIN' : false;
  }

  esCliente(): boolean {
    const userData = this.obtenerDatosUsuario();
    return userData ? userData.rolPrincipal === 'CLIENTE' || userData.rolPrincipal === 'USER' : false;
  }

  obtenerNombreUsuario(): string {
    const userData = this.obtenerDatosUsuario();
    return userData ? userData.nombreCompleto : '';
  }

  cerrarSesion(): void {
    localStorage.removeItem('ecoalerta_token');
    localStorage.removeItem('ecoalerta_userData');
    sessionStorage.removeItem('ecoalerta_token');
    sessionStorage.removeItem('ecoalerta_userData');
  }

  // Método para verificar si el token es válido (opcional - requiere endpoint en backend)
  verificarToken(): Observable<RespuestaJsend<JwtResponse>> {
    const token = this.obtenerToken();
    if (!token) {
      throw new Error('No hay token disponible');
    }
    return this.http.get<RespuestaJsend<JwtResponse>>(`${this.apiUrl}/verificar-token`);
  }

  // Método para decodificar JWT y extraer información del usuario
  private decodificarToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return null;
    }
  }

  // Método para configurar token manualmente (útil para desarrollo/testing)
  configurarTokenManual(token: string, recordarme: boolean = false): boolean {
    try {
      const payload = this.decodificarToken(token);
      if (!payload) {
        console.error('Token inválido');
        return false;
      }

      // Crear objeto JwtResponse basado en el payload del token
      const userData: JwtResponse = {
        token: token,
        tipo: 'Bearer',
        correo: payload.sub || '',
        rolPrincipal: payload.rol || 'USER',
        roles: [payload.rol || 'USER'],
        nombreCompleto: payload.nombre || payload.sub || 'Usuario'
      };

      this.guardarToken(token, userData, recordarme);
      console.log('Token configurado exitosamente:', userData);
      return true;
    } catch (error) {
      console.error('Error al configurar token:', error);
      return false;
    }
  }
}
