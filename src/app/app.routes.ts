import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'paywall',
    loadComponent: () => import('./features/paywall/paywall.page').then((m) => m.PaywallPage),
  },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
];
