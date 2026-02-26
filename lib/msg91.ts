export async function sendOTP(phone: string) {
  const key = (process.env.MSG91_AUTH_KEY || "").trim();
  if (!key) throw new Error("MSG91_AUTH_KEY is not set");
  const mobile = String(phone || "").replace(/[^0-9]/g, "");
  const res = await fetch("https://control.msg91.com/api/v5/otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile, otp_length: 4 }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(String(data?.message || "provider_error"));
  return data;
}

export async function verifyOTP(phone: string, otp: string) {
  const key = (process.env.MSG91_AUTH_KEY || "").trim();
  if (!key) throw new Error("MSG91_AUTH_KEY is not set");
  const mobile = String(phone || "").replace(/[^0-9]/g, "");
  const res = await fetch("https://control.msg91.com/api/v5/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile, otp }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(String(data?.message || "invalid_otp"));
  return data;
}
