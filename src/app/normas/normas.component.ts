import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-normas',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <button mat-icon-button class="back-button" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          <span style="margin-left: 8px; font-weight: 600;">VOLVER</span>
        </button>
        <div class="logo">🍃 ECOALERTA</div>
        <div class="spacer"></div>
      </div>
      
      <div class="content">
        <mat-card class="normas-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>gavel</mat-icon>
              NORMAS DE LA COMUNIDAD ECOALERTA
            </mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <div class="norma-section">
              <h3><mat-icon>eco</mat-icon> 1. Respeto al Medio Ambiente</h3>
              <p>Todos los reportes deben estar relacionados con problemas ambientales reales y verificables. No se permiten reportes falsos o malintencionados.</p>
            </div>
            
            <div class="norma-section">
              <h3><mat-icon>people</mat-icon> 2. Respeto a la Comunidad</h3>
              <p>Mantén un trato respetuoso con todos los miembros de la comunidad. No se toleran insultos, discriminación o acoso de ningún tipo.</p>
            </div>
            
            <div class="norma-section">
              <h3><mat-icon>verified</mat-icon> 3. Veracidad de la Información</h3>
              <p>Proporciona información precisa y veraz en todos tus reportes. Las fotografías y descripciones deben corresponder al problema reportado.</p>
            </div>
            
            <div class="norma-section">
              <h3><mat-icon>location_on</mat-icon> 4. Ubicación Correcta</h3>
              <p>Asegúrate de que la ubicación del reporte sea precisa. Los reportes con ubicaciones incorrectas intencionalmente serán sancionados.</p>
            </div>
            
            <div class="norma-section">
              <h3><mat-icon>report_problem</mat-icon> 5. Uso Responsable del Sistema</h3>
              <p>No abuses del sistema de reportes. Los reportes duplicados, spam o uso malintencionado resultarán en la suspensión de la cuenta.</p>
            </div>
            
            <div class="norma-section">
              <h3><mat-icon>privacy_tip</mat-icon> 6. Privacidad y Datos Personales</h3>
              <p>No compartas información personal de terceros sin su consentimiento. Respeta la privacidad de otros usuarios.</p>
            </div>
            
            <div class="norma-section">
              <h3><mat-icon>security</mat-icon> 7. Seguridad de la Plataforma</h3>
              <p>No intentes vulnerar la seguridad de la plataforma. Cualquier intento de hackeo o manipulación del sistema resultará en baneo permanente.</p>
            </div>
            
            <div class="norma-section">
              <h3><mat-icon>balance</mat-icon> 8. Cumplimiento Legal</h3>
              <p>Todos los reportes deben cumplir con las leyes locales y nacionales. No se permiten contenidos ilegales o que promuevan actividades ilícitas.</p>
            </div>
            
            <div class="warning-section">
              <mat-icon>warning</mat-icon>
              <h3>CONSECUENCIAS DEL INCUMPLIMIENTO</h3>
              <p>El incumplimiento de estas normas puede resultar en:</p>
              <ul>
                <li>Advertencia por primera infracción</li>
                <li>Suspensión temporal de la cuenta</li>
                <li>Baneo permanente de la cuenta</li>
                <li>Reporte a las autoridades competentes en casos graves</li>
              </ul>
            </div>
            
            <div class="contact-section">
              <mat-icon>contact_support</mat-icon>
              <h3>CONTACTO</h3>
              <p>Si tienes dudas sobre estas normas o deseas reportar una violación, contacta a nuestro equipo de soporte:</p>
              <p><strong>Email:</strong> soporte&#64;ecoalerta.com</p>
              <p><strong>Teléfono:</strong> +51 999 888 777</p>
            </div>
          </mat-card-content>
          
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              Volver
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
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

    .spacer {
      width: 100px;
    }

    .content {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .normas-card {
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border-radius: 16px;
      overflow: hidden;
    }

    mat-card-header {
      background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%);
      color: white;
      padding: 2rem;
      margin: -24px -24px 24px -24px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .norma-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: rgba(46, 125, 50, 0.05);
      border-radius: 12px;
      border-left: 4px solid #4caf50;
    }

    .norma-section h3 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #2e7d32;
      margin-bottom: 1rem;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .norma-section p {
      color: #424242;
      line-height: 1.6;
      margin: 0;
    }

    .warning-section {
      background: rgba(255, 152, 0, 0.1);
      border-left: 4px solid #ff9800;
      padding: 1.5rem;
      border-radius: 12px;
      margin: 2rem 0;
    }

    .warning-section mat-icon {
      color: #ff9800;
      margin-right: 0.5rem;
    }

    .warning-section h3 {
      display: flex;
      align-items: center;
      color: #f57c00;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .warning-section ul {
      margin: 1rem 0;
      padding-left: 1.5rem;
    }

    .warning-section li {
      margin-bottom: 0.5rem;
      color: #424242;
    }

    .contact-section {
      background: rgba(33, 150, 243, 0.1);
      border-left: 4px solid #2196f3;
      padding: 1.5rem;
      border-radius: 12px;
      margin: 2rem 0;
    }

    .contact-section mat-icon {
      color: #2196f3;
      margin-right: 0.5rem;
    }

    .contact-section h3 {
      display: flex;
      align-items: center;
      color: #1976d2;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .contact-section p {
      color: #424242;
      margin-bottom: 0.5rem;
    }

    mat-card-actions {
      padding: 1.5rem;
      display: flex;
      justify-content: center;
    }

    @media (max-width: 768px) {
      .content {
        padding: 1rem;
      }

      .header {
        padding: 1rem;
      }

      .norma-section,
      .warning-section,
      .contact-section {
        padding: 1rem;
      }

      mat-card-header {
        padding: 1.5rem;
      }

      mat-card-title {
        font-size: 1.2rem;
      }
    }
  `]
})
export class NormasComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/']);
  }
}