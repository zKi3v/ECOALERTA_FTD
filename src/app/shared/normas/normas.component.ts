import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-normas',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './normas.component.html',
  styleUrls: ['./normas.component.scss']
})
export class NormasComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/create-report']);
  }
}