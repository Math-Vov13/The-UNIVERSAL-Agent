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
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.map((message, index) => ( message.content.trim() !== "" && (
                <ChatMessage key={index} index={message.id} message={message} /> )
            ))}

            {isLoading && (
                <div className="flex items-start space-x-4">
                    <Shuffle
                        key={`loading-${messages.length}`}
                        text="just a moment..."
                        className='px-5 py-4 text-gray-400 rounded-2xl text-1xl'
                        shuffleDirection="right"
                        loop={true}
                        loopDelay={1}
                        duration={0.35}
                        maxDelay={0.1}
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