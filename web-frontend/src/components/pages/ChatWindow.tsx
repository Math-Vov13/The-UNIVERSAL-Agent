"use client";
import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import Shuffle from '../Shuffle';
import z from "zod";
import { message_schema } from "@/lib/types/client.schema";

type ChatWindowProps = {
  messages: z.infer<typeof message_schema>[];
  isLoading: boolean;
};

export default function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 space-y-8 custom-scrollbar">
      {messages.map((message, index) => {
        const shouldRender =
          message.content.length !== 0 || message.status === "completed";
        if (!shouldRender) return null;

        return (
          <ChatMessage
            key={index}
            index={message.id}
            message={message}
            isLast={index === messages.length - 1}
          />
        );
      })}

      {isLoading && (
        <div className="flex items-center gap-3 animate-slideInLeft">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#3A29FF] to-[#FF94B4] flex-shrink-0" />
          <Shuffle
            key={`loading-${messages.length}`}
            text="thinking…"
            className="text-sm text-gray-600 font-mono"
            shuffleDirection="right"
            loop
            loopDelay={1}
            duration={0.35}
            maxDelay={0.07}
            triggerOnce={false}
            threshold={0}
            rootMargin="0px"
          />
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
