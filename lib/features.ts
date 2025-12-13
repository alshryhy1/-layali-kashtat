// lib/features.ts

export const FEATURES = {
  // فتح استقبال الطلبات / التسجيل (عام)
  requestsEnabled: true,

  // وضع الصيانة (عام)
  maintenanceMode: false,

  // تفعيل صفحة تسجيل مقدم الخدمة (الداشبورد يعتمد عليها)
  providerSignupEnabled: true,
} as const;

export function requestsOpen() {
  return FEATURES.requestsEnabled;
}
