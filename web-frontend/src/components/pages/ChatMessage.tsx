import z from "zod";
import { YouTubeEmbed } from "./Messages/YoutubeEmbed";
import MessageFormat from "./Messages/MessageFormat";
import { ToolUsed } from "./Messages/ToolUsed";
import { message_schema } from "@/lib/types/client.schema";

export default function ChatMessage({ message, index }: { message: z.infer<typeof message_schema>, index: string }) {
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
        // style={{ animationDelay: `${index * 0.1}s` }}
        >
            {message.role === 'user' ? (
                <>
                    <div className="group relative max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-5 py-4 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl bg-gray-800">
                        {message.files && message.files.length > 0 && (
                            <div className="mb-2 bg-gray-700 p-2 rounded-lg">
                                <div className="flex flex-wrap gap-2">
                                    {message.files.slice(0, 5).map((file, idx) => (
                                        <div key={idx} className="flex-shrink-0 w-20 h-40 hover:scale-105 transition-transform">
                                            {file.type === 'image' ? (
                                                <img
                                                    src={file.data ? URL.createObjectURL(file.data) : `${process.env.NEXT_PUBLIC_CLOUDFRONT}/${file.uri}`}
                                                    alt={`Uploaded file ${idx}`}
                                                    className="w-full h-full object-cover rounded-lg cursor-pointer"
                                                    onClick={() => window.open(`${process.env.NEXT_PUBLIC_CLOUDFRONT}/${file.uri}`, '_blank')}
                                                />
                                            ) : (
                                                <a href={file.data ? URL.createObjectURL(file.data) : `${process.env.NEXT_PUBLIC_CLOUDFRONT}/${file.uri}`} target="_blank" rel="noreferrer"
                                                    download
                                                    className="flex items-center justify-center w-full h-full bg-gray-600 rounded-lg text-xs text-blue-400">
                                                    {(file.data?.name || file.name || '<untitled>').substring(0, 10)}{(file.data?.name || file.name || '<untitled>').length > 10 ? '...' : ''}
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="text-s leading-relaxed font-medium ">
                            <p>
                                {message.content}
                            </p>
                        </div>
                    </div>
                    <div className="p-2.5"></div>
                </>
            ) : (
                <>
                    <div className="group relative max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-5 py-4 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl backdrop-blur-md border-x border-gray-700">
                        {message.tools && message.tools.length > 0 && (
                            <div className="mb-2">
                                <div className="bg-gray-800 rounded-md p-2 space-y-1">
                                    {message.tools.map((tool, idx) => (
                                        <ToolUsed key={idx} id={idx} tool={tool} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="text-s leading-relaxed">
                            <MessageFormat message={message.content === "" ? "No content*" : message.content} />
                        </div>
                    </div>
                    {urls.length > 0 && (
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
                </>
            )}
        </div>
    );
}