// Copy to environment.ts (production: false, debugLogs: true) and
// environment.prod.ts (production: true, debugLogs: false), then fill in the keys.
// Both copies are git-ignored.
export const environment = {
  production: false,
  firebase: {
    apiKey: 'FIREBASE_API_KEY',
    authDomain: 'FIREBASE_AUTH_DOMAIN',
    projectId: 'FIREBASE_PROJECT_ID',
    storageBucket: 'FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'FIREBASE_MESSAGING_SENDER_ID',
    appId: 'FIREBASE_APP_ID',
    measurementId: 'FIREBASE_MEASUREMENT_ID',
  },
  revenueCat: {
    // Public SDK key only: Test Store ("test_") for development builds,
    // Google Play ("goog_") for production. Never a secret/server key.
    apiKey: 'REVENUECAT_API_KEY',
    debugLogs: true,
  },
};
