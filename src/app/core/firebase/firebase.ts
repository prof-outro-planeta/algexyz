import { InjectionToken, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { environment } from '../../../environments/environment';

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP', {
  providedIn: 'root',
  factory: () => initializeApp(environment.firebase),
});

export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH', {
  providedIn: 'root',
  factory: () => {
    const app = inject(FIREBASE_APP);
    // getAuth() hangs inside the Capacitor native WebView; it needs an explicit persistence.
    return Capacitor.isNativePlatform()
      ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
      : getAuth(app);
  },
});

export const FIRESTORE = new InjectionToken<Firestore>('FIRESTORE', {
  providedIn: 'root',
  factory: () => getFirestore(inject(FIREBASE_APP)),
});
