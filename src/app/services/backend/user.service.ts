import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UsuarioResponse {
  idUsuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  username: string;
  usernameModificado: boolean;
  telefono?: string;
  direccion?: string;
  fechaRegistro: string;
  activo: boolean;
  rolPrincipal: string;
  ubigeo?: {
    idUbigeo: number;
    departamento: string;
    provincia: string;
    distrito: string;
  };
}

export interface UsuarioActualizarDTO {
  nombre: string;
  apellido: string;
  correo?: string;
  username?: string;
  telefono?: string;
  direccion?: string;
  idUbigeo: number;
}

export interface CambioContrasenaRequest {
  contrasenaActual: string;
  nuevaContrasena: string;
  confirmarNuevaContrasena: string;
}

export interface RespuestaJsend<T> {
  status: string;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = 'http://localhost:5100';

  constructor(private http: HttpClient) {}

  obtenerPerfil(token: string): Observable<RespuestaJsend<UsuarioResponse>> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<RespuestaJsend<UsuarioResponse>>(
      `${this.apiUrl}/usuarios/me`,
      { headers }
    );
  }

  actualizarPerfil(token: string, datos: UsuarioActualizarDTO): Observable<RespuestaJsend<UsuarioResponse>> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<RespuestaJsend<UsuarioResponse>>(
      `${this.apiUrl}/usuarios/me`,
      datos,
      { headers }
    );
  }

  cambiarContrasena(token: string, datos: CambioContrasenaRequest): Observable<RespuestaJsend<void>> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<RespuestaJsend<void>>(
      `${this.apiUrl}/usuarios/me/cambiar-contrasena`,
      datos,
      { headers }
    );
  }

  banearUsuario(token: string, idUsuario: number): Observable<RespuestaJsend<void>> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<RespuestaJsend<void>>(
      `${this.apiUrl}/usuarios/${idUsuario}/banear`,
      {},
      { headers }
    );
  }

  banearUsuarioPorCorreo(token: string, correo: string): Observable<RespuestaJsend<void>> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<RespuestaJsend<void>>(
      `${this.apiUrl}/usuarios/banear-por-correo`,
      { correo },
      { headers }
    );
  }
}