 
 import bcrypt from "bcrypt";
 import jwt from "jsonwebtoken";
 import { cookies } from "next/headers";
 
 const SECRET = process.env.JWT_SECRET || "layali-kashtat-customer-secret-key-123";
 const COOKIE_NAME = "customer_token";
 
 export async function hashPassword(plain: string) {
   return await bcrypt.hash(plain, 10);
 }
 
 export async function comparePassword(plain: string, hashed: string) {
   return await bcrypt.compare(plain, hashed);
 }
 
 export function signToken(payload: any) {
   return jwt.sign(payload, SECRET, { expiresIn: "30d" });
 }
 
 export function verifyToken(token: string) {
   try {
     return jwt.verify(token, SECRET);
   } catch {
     return null;
   }
 }
 
 export async function setSession(customer: { id: string; name: string; phone: string; email: string }) {
   const token = signToken({
     id: customer.id,
     name: customer.name,
     phone: customer.phone,
     email: customer.email,
     role: "customer"
   });
 
   const cookieStore = await cookies();
   cookieStore.set(COOKIE_NAME, token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
     path: "/",
     maxAge: 60 * 60 * 24 * 30,
   });
 }
 
 export async function getSession() {
   const cookieStore = await cookies();
   const token = cookieStore.get(COOKIE_NAME)?.value;
   if (!token) return null;
   return verifyToken(token) as { id: string; name: string; phone: string; email: string; role: string } | null;
 }
 
 export async function clearSession() {
   const cookieStore = await cookies();
   cookieStore.delete(COOKIE_NAME);
 }
