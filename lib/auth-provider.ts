 
import { cookies } from "next/headers";
import crypto from "crypto";
 
const SECRET = process.env.PROVIDER_SESSION_SECRET || "";
 const COOKIE_NAME = "kashtat_provider_token";
 
 function sign(payload: string, secret: string) {
   return crypto.createHmac("sha256", secret).update(payload).digest("hex");
 }
 
 export async function getProviderSession() {
   const cookieStore = await cookies();
   const token = cookieStore.get(COOKIE_NAME)?.value;
   
   if (!token) return null;
  if (!SECRET) return null;
 
   try {
     const raw = Buffer.from(token, "base64url").toString("utf8");
     const i = raw.lastIndexOf(".");
     if (i <= 0) return null;
     
     const payloadStr = raw.slice(0, i);
     const sig = raw.slice(i + 1);
     
     if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(sign(payloadStr, SECRET)))) {
       return null;
     }
 
     const payload = JSON.parse(payloadStr);
     if (Date.now() > payload.exp) return null;
 
     return payload as {
       id: string;
       email: string;
       phone: string;
       name: string;
       city: string;
       service: string;
       status: string;
       exp: number;
     };
   } catch {
     return null;
   }
 }
