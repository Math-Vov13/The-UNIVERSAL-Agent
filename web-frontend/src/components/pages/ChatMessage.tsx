import { message_schema } from "@/lib/db";
import Markdown from "react-markdown";
import z from "zod";

export default function ChatMessage({ message, index }: { message: z.infer<typeof message_schema>, index: number }) {
    // const formatTime = (date: Date) => {
    //     return date.toLocaleTimeString('fr-FR', {
    //         hour: '2-digit',
    //         minute: '2-digit'
    //     })
    // }

    return (
        <div
            key={index}
            className={`flex items-start space-x-4 ${message.role === 'user'
                ? 'justify-end animate-slideInRight'
                : 'justify-start animate-slideInLeft'
                }`}
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            <div className={`group relative max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-5 py-4 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl ${message.role === 'user' ?
                'bg-gray-800' : 'backdrop-blur-md border border-gray-700'
            }`}>
                <div className={`text-s leading-relaxed ${message.role === 'user' ? 'font-medium' : ''}`}>
                    <div className="prose prose-lg max-w-none">
                        <Markdown>
                            {message.content === "" ? "No content*" : message.content}
                        </Markdown>
                    </div>
                </div>
            </div>
            {message.role === 'user' && (
                <div className="p-2.5"></div>
            )}
        </div>
    );
}