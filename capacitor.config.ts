import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.algexyz.app',
  appName: 'algexyz',
  webDir: 'www',
  backgroundColor: '#161616',
  plugins: {
    SystemBars: {
      style: 'DARK',
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
