"use client";
import ChatBarProps from "@/components/pages/ChatBar";
import ChatWindow from "@/components/pages/ChatWindow";
import { useHistory } from "@/components/Providers/historyProvider";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { PlusSquare } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";




export default function ChatPage() {
  const { isLoading, history, isThinking, isAuthorized } = useHistory();

  if (!isAuthorized) {
    return (
      <main className="flex flex-col h-screen">
        <nav className="h-16 bg-gray-800 flex items-center px-4">
          <button type="button" className="text-purple-400 p-[3px] relative mr-4">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" />
            <div className="bg-black rounded-[6px]  relative group transition duration-200 text-white hover:bg-transparent">
              <Link className="px-4 py-2 text-purple-400 hover:text-white hover:font-semibold gap-2 flex items-center" href="/chat"><PlusSquare /><span>Start new chat</span></Link>
            </div>
          </button>
          <h1 className="text-white text-lg font-semibold">Chat with AI Assistant</h1>
        </nav>
        <div className="flex flex-1 flex-col overflow-hidden">
          <p className="text-gray-500 mx-auto my-auto h-full p-6">403 - This conversation is private or not does not exist.</p>
          <div className="h-auto w-auto mx-auto my-auto">
            <Link href="/chat" className="text-purple-400 hover:text-purple-300">Chat with AI</Link>
            {" • "}
            <Link href="/" className="text-purple-400 hover:text-purple-300">Go back to home</Link>
          </div>
          <div className="p-6 rounded-lg bg-gray-800/10 backdrop-blur-md max-w-md mx-auto my-8 text-center">
            <p className="mb-4">You do not have access to this conversation.</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">
                Learn why you are seeing this message <Link href="/docs" className="text-purple-400 hover:text-purple-300 underline">here</Link>.
              </p>
              <p className="text-sm text-gray-400 mt-4">
                if this is unexpected, please <Link href="/feedback" className="text-purple-400 hover:text-purple-300 underline">let us know</Link>.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-screen">
      <nav className="h-16 bg-gray-800 flex items-center px-4">
        <button type="button" className="text-purple-400 p-[3px] relative mr-4">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" />
          <div className="bg-black rounded-[6px]  relative group transition duration-200 text-white hover:bg-transparent">
            <Link className="px-4 py-2 text-purple-400 hover:text-white hover:font-semibold gap-2 flex items-center" href="/chat"><PlusSquare /><span>Start new chat</span></Link>
          </div>
        </button>
        <h1 className="text-white text-lg font-semibold">Chat with AI Assistant</h1>
      </nav>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20 h-full w-[60%] mx-auto flex flex-col">
          <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p className="text-gray-500">Loading chat...</p></div>}>
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">Loading conversation history...</p>
              </div>
            ) : (
              <ChatWindow
                messages={history}
                isLoading={isThinking}
              />
            )}
          </Suspense>
          <div className="p-4 px-12 rounded-t-3xl bg-gray-800/10 backdrop-blur-md">
            <ChatBarProps stateBar="chat" blocked={isThinking} />
          </div>
        </div>
      </div>
      <BackgroundBeams className="z-[-1]" />
    </main>
  );
}
