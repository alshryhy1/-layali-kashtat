import { redirect } from "next/navigation";

export default function RootPage() {
  // افتراضي ثابت لتجنب مشاكل headers() في dev
  redirect("/ar");
}
