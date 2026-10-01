import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'converter',
        loadComponent: () =>
          import('../features/converter/converter.page').then((m) => m.ConverterPage),
      },
      {
        path: 'calculator',
        loadComponent: () =>
          import('../features/calculator/calculator.page').then((m) => m.CalculatorPage),
      },
      {
        path: 'practice',
        loadComponent: () =>
          import('../features/practice/practice.page').then((m) => m.PracticePage),
      },
      {
        path: '',
        redirectTo: '/tabs/converter',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/converter',
    pathMatch: 'full',
  },
];
