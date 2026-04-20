"use client";
import ChatBarProps from "@/components/pages/ChatBar";
import ChatWindow from "@/components/pages/ChatWindow";
import { useHistory } from "@/components/Providers/historyProvider";
import { StarsBackground } from "@/components/ui/stars-background";
import { PlusSquare } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export default function ChatPage() {
  const { isLoading, error, history, isWorking, isAuthorized, retrySendMessage } = useHistory();

  if (!isAuthorized) {
    return (
      <main className="relative flex flex-col h-screen bg-[#07070d] text-white overflow-hidden">
        {/* Galaxy background */}
        <StarsBackground starDensity={0.0003} className="z-0" />
        <div className="fixed inset-0 z-[1] pointer-events-none nebula-overlay" />

        <nav className="relative z-50 fixed top-0 inset-x-0 flex items-center justify-between px-6 h-14 border-b border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#3A29FF] to-[#FF94B4]" />
            <span className="text-sm font-semibold tracking-widest text-white/70 uppercase">Universal</span>
          </Link>
          <Link href="/chat" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
            <PlusSquare className="w-4 h-4" />
            <span>New chat</span>
          </Link>
        </nav>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 pt-14 px-6 text-center">
          <p className="text-xs font-mono text-red-400 tracking-widest uppercase">403 — Access denied</p>
          <h1 className="text-3xl font-bold tracking-tight">This conversation doesn&apos;t exist.</h1>
          <p className="text-gray-600 text-sm max-w-xs">
            The conversation is private, expired, or was never created.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <Link href="/chat" className="px-5 py-2.5 rounded-full text-sm font-medium bg-white/[0.06] border border-white/[0.10] hover:bg-white/[0.10] transition-colors">
              New chat
            </Link>
            <Link href="/" className="text-sm text-gray-600 hover:text-white transition-colors">
              Go home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex flex-col h-screen bg-[#07070d] text-white overflow-hidden">

      {/* Stars canvas — deepest layer */}
      <StarsBackground starDensity={0.0003} className="z-0" />

      {/* Nebula gradient overlay */}
      <div className="fixed inset-0 z-[1] pointer-events-none nebula-overlay" />

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 h-14 border-b border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#3A29FF] to-[#FF94B4]" />
          <span className="text-sm font-semibold tracking-widest text-white/60 group-hover:text-white/90 uppercase transition-colors">Universal</span>
        </Link>
        <Link href="/chat" className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-white transition-colors">
          <PlusSquare className="w-4 h-4" />
          <span>New chat</span>
        </Link>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden pt-14">
        <div className="flex flex-1 flex-col overflow-hidden max-w-3xl w-full mx-auto">

          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-700 text-sm font-mono">Loading…</p>
            </div>
          }>
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-700 text-sm font-mono animate-pulse">Loading conversation…</p>
              </div>
            ) : (
              <ChatWindow messages={history} isLoading={isWorking} />
            )}
          </Suspense>

          {/* Input area */}
          <div className="px-4 pb-5 pt-2">
            {error && (
              <div className="mb-3 flex items-center justify-between px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <span>An error occurred while sending the request.</span>
                <button
                  type="button"
                  className="ml-3 underline hover:text-red-300 transition-colors cursor-pointer"
                  onClick={() => retrySendMessage()}
                >
                  Retry
                </button>
              </div>
            )}
            <ChatBarProps stateBar="chat" blocked={isWorking} />
          </div>

        </div>
      </div>
    </main>
  );
}
