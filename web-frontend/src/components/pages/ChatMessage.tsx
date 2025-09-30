import { message_schema } from "@/lib/db";
import z from "zod";
import { YouTubeEmbed } from "./YoutubeEmbed";
import MessageFormat from "./MessageFormat";

export default function ChatMessage({ message, index }: { message: z.infer<typeof message_schema>, index: number }) {
    // const formatTime = (date: Date) => {
    //     return date.toLocaleTimeString('fr-FR', {
    //         hour: '2-digit',
    //         minute: '2-digit'
    //     })
    // }

    const urls = message.content.match(/(https?:\/\/[^\s]+)/g) || [];

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
                'bg-gray-800' : 'backdrop-blur-md border-x border-gray-700'
                }`}>
                <div className={`text-s leading-relaxed ${message.role === 'user' ? 'font-medium' : ''}`}>
                    {message.role === 'assistant' && (
                        <MessageFormat message={message.content === "" ? "No content*" : message.content} />
                    ) || (
                            <p>
                                {message.content}
                            </p>
                        )
                    }
                </div>
            </div>
            {message.role === 'assistant' && urls.length > 0 && (
                <div className="w-full mt-2 flex flex-col items-start">
                    {urls.map((url, idx) => (
                        url.includes('youtube.com') || url.includes('youtu.be') ? (
                            <div key={idx} className="w-full h-full">
                                <YouTubeEmbed videoUrl={url} />
                            </div>
                        ) : null
                    ))}
                </div>
            )}
            {message.role === 'user' && (
                <div className="p-2.5"></div>
            )}
        </div>
    );
}