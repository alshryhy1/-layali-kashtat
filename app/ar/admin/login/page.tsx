import AdminLoginClient from "@/components/AdminLoginClient";

export const dynamic = "force-dynamic";

export default function Page({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const next = searchParams?.next || "/ar/admin/requests";
  return <AdminLoginClient locale="ar" next={next} />;
}
