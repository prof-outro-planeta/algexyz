import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.algexyz.app',
  appName: 'algexyz',
  webDir: 'www',
  backgroundColor: '#161616',
  plugins: {
    // Without viewport-fit=cover in index.html, SystemBars pads the native window around the
    // status and navigation bars and reports zero safe-area insets to the web layer.
    SystemBars: {
      style: 'DARK',
    },
  },
};

export default config;
