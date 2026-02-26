 // lib/features.ts
 
 export const FEATURES = {
   requestsEnabled: true,
   maintenanceMode: false,
   providerSignupEnabled: true,
 } as const;
 
 export function requestsOpen() {
   return FEATURES.requestsEnabled;
 }
