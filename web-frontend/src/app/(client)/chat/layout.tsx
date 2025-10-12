import type { Metadata } from "next";
import { HistoryProvider } from "@/components/Providers/historyProvider";

export const metadata: Metadata = {
  title: "Chat - UNI Agent",
  description: "Your AI-powered assistant for everything.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <HistoryProvider>{children}</HistoryProvider>
  );
}
