import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Auth } from './backend/auth.service';

export interface Notification {
  id: number;
  titulo: string;
  mensaje: string;
  fecha: string;
  tipo: 'nuevo_reporte' | 'estado_reporte';
  idReporte?: number;
  leido: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(private http: HttpClient, private auth: Auth) {}

  private readonly apiUrl = 'http://localhost:5100';

  async getNotifications(isAdmin: boolean): Promise<Notification[]> {
    try {
      const token = this.auth.obtenerToken();
      if (!token) {
        console.error('No hay token de autenticación disponible');
        return [];
      }

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      const response = await this.http.get<Notification[]>(
        `${this.apiUrl}${isAdmin ? '/api/admin/notifications' : '/api/user/notifications'}`,
        { headers }
      ).toPromise();
      return response || [];
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      return [];
    }
  }

  async markAsRead(notificationId: number): Promise<void> {
    try {
      const token = this.auth.obtenerToken();
      if (!token) {
        console.error('No hay token de autenticación disponible');
        return;
      }

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      await this.http.post(`${this.apiUrl}/api/notifications/${notificationId}/read`, {}, { headers }).toPromise();
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const token = this.auth.obtenerToken();
      if (!token) {
        console.error('No hay token de autenticación disponible');
        return;
      }

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      await this.http.post(`${this.apiUrl}/api/notifications/mark-all-read`, {}, { headers }).toPromise();
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
    }
  }

  getTimeAgo(fecha: string): string {
    const now = new Date();
    const notificationDate = new Date(fecha);
    const diffInMs = now.getTime() - notificationDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Hace un momento';
    } else if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else {
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    }
  }

  updateNotifications(notifications: Notification[]): void {
    this.notificationsSubject.next(notifications);
  }
}
