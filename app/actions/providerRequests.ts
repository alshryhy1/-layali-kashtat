"use server";

import { supabaseServer } from "@/lib/supabaseServer";

type State = { ok: boolean; message: string } | null;

function clean(v: unknown) {
  return String(v ?? "").trim();
}

export async function createProviderRequest(
  _prevState: State,
  formData: FormData
): Promise<State> {
  const name = clean(formData.get("name"));
  const phone = clean(formData.get("phone"));
  const service_type = clean(formData.get("service_type"));
  const city = clean(formData.get("city"));

  if (!name || !phone || !service_type || !city) {
    return { ok: false, message: "الرجاء تعبئة كل الحقول" };
  }

  const { error } = await supabaseServer.from("provider_requests").insert([
    { name, phone, service_type, city },
  ]);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "تم إرسال الطلب بنجاح" };
}
