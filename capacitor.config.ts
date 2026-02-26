import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.layalikashtat.app',
  appName: 'Layali Kashtat',
  webDir: 'public',
  server: {
    // ⚠️ هام: يجب وضع رابط الموقع الحي هنا بعد رفعه على الإنترنت
    // Example: https://layali-kashtat.com
    url: 'http://localhost:3000', 
    cleartext: true
  }
};

export default config;
