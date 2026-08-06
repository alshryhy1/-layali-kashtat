import ChatInboxClient from "@/components/ChatInboxClient";

type Locale = "ar" | "en";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = raw === "en" ? "en" : "ar";
  return <ChatInboxClient locale={locale} />;
}
