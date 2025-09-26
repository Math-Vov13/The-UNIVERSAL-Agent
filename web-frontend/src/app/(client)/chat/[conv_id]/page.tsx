"use client";
import ChatBarProps from "@/components/pages/ChatBar";
import ChatWindow from "@/components/pages/ChatWindow";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { PlusSquare } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export default function ChatPage() {
  const authorized = true; // Replace with actual authorization logic
  const params = useSearchParams();
  const { conv_id } = useParams();
  const conversationId = Array.isArray(conv_id) ? (conv_id[0] ?? "") : (conv_id ?? "");
  const firstMessage = (params.get('first') || '').trim();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const messageIdRef = useRef(0);
  const messagesRef = useRef<ChatMessage[]>([]);
  const lastBootstrapKeyRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);


  const sendMessageToAgent = useCallback(
    async (history: ChatMessage[], prompt: string) => {
      if (!prompt || !isMountedRef.current) {
        return;
      }

      setIsThinking(true);

      try {
        const historyPayload = history.map(({ timestamp, ...rest }) => ({
          ...rest,
          timestamp: timestamp instanceof Date ? timestamp.toISOString() : timestamp,
        }));

        const response = await fetch("/api-client/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            history: historyPayload,
            conversation_id: conversationId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        const responseText: string = data?.response ?? "Sorry, I couldn't generate a response.";

        messageIdRef.current += 1;
        const assistantMessage: ChatMessage = {
          id: messageIdRef.current,
          role: "assistant",
          content: responseText,
          timestamp: new Date(),
        };

        if (!isMountedRef.current) {
          return;
        }

        setMessages((previous) => {
          const next = [...previous, assistantMessage];
          messagesRef.current = next;
          return next;
        });
      } catch (error) {
        console.error("Error generating response:", error);

        messageIdRef.current += 1;
        const errorMessage: ChatMessage = {
          id: messageIdRef.current,
          role: "assistant",
          content: "Sorry, an error occurred. Please try again.",
          timestamp: new Date(),
        };

        if (!isMountedRef.current) {
          return;
        }

        setMessages((previous) => {
          const next = [...previous, errorMessage];
          messagesRef.current = next;
          return next;
        });
      } finally {
        if (isMountedRef.current) {
          setIsThinking(false);
        }
      }
    },
    [conversationId]
  );

  useEffect(() => {
    const bootstrapKey = `${conversationId}|${firstMessage}`;

    if (!firstMessage) {
      messageIdRef.current = 0;
      messagesRef.current = [];
      lastBootstrapKeyRef.current = bootstrapKey;
      setIsThinking(false);
      setMessages([]);
      return;
    }

    if (lastBootstrapKeyRef.current === bootstrapKey) {
      return;
    }

    lastBootstrapKeyRef.current = bootstrapKey;

    messageIdRef.current = 1;
    const initialMessage: ChatMessage = {
      id: 1,
      role: "user",
      content: firstMessage,
      timestamp: new Date(),
    };

    const initialMessages = [initialMessage];
    messagesRef.current = initialMessages;
    setMessages(initialMessages);

    void sendMessageToAgent(initialMessages, initialMessage.content);
  }, [conversationId, firstMessage, sendMessageToAgent]);

  const handleSubmit = useCallback(
    async (message: string, _files: FileList | null) => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage) {
        return;
      }

      messageIdRef.current += 1;
      const userMessage: ChatMessage = {
        id: messageIdRef.current,
        role: "user",
        content: trimmedMessage,
        timestamp: new Date(),
      };

      const nextMessages = [...messagesRef.current, userMessage];
      messagesRef.current = nextMessages;
      setMessages(nextMessages);

      await sendMessageToAgent(nextMessages, trimmedMessage);
    },
    [sendMessageToAgent]
  );


  if (!authorized) {
    return (
      <main className="flex flex-col h-screen">
        <div className="flex flex-1 flex-col overflow-hidden">
          <p className="text-gray-500 mx-auto my-auto h-full p-6">403 - This conversation is private or not does not exist.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-screen">
      <nav className="h-16 bg-gray-800 flex items-center px-4">
        <button className="text-purple-400 p-[3px] relative mr-4">
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
            <ChatWindow
              messages={messages}
              isLoading={isThinking}
            />
          </Suspense>
          <div className="p-4 px-12 rounded-t-3xl bg-gray-800/10 backdrop-blur-md">
            <ChatBarProps stateBar="chat" handleSubmit={handleSubmit} />
          </div>
        </div>
      </div>
      <BackgroundBeams className="z-[-1]" />
    </main>
  );
}
