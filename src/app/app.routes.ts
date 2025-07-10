import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent) 
  },
  { 
    path: 'reset-password', 
    loadComponent: () => import('./auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) 
  },
  {
    path: 'map',
    loadComponent: () => import('./map-view/map-view.component').then(m => m.MapViewComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./reports/report-list/report-list.component').then(m => m.ReportListComponent)
  },
  {
    path: 'reports/:id',
    loadComponent: () => import('./reports/report-detail/report-detail.component').then(m => m.ReportDetailComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./user/user-profile/user-profile.component').then(m => m.UserProfileComponent)
  },
  {
    path: 'create-report',
    loadComponent: () => import('./reports/create-report/create-report.component').then(m => m.CreateReportComponent)
  },
  {
    path: 'admin-dashboard',
    loadComponent: () => import('./admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'normas',
    loadComponent: () => import('./normas/normas.component').then(m => m.NormasComponent)
  },
  { 
    path: '**', 
    redirectTo: '' 
  }
];
