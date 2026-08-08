import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.symmetri.app',
  appName: 'Symmetri',
  webDir: 'public',
  server: {
    url: 'http://192.168.12.253:3000',
    cleartext: true
  }
};

export default config;
