import z from "zod";
import { YouTubeEmbed } from "./Messages/YoutubeEmbed";
import MessageFormat from "./Messages/MessageFormat";
// import { ToolUsed } from "./Messages/ToolUsed";
import { message_schema } from "@/lib/types/client.schema";
import { EarthIcon, GitBranchPlus, Globe, LucideBookmarkPlus, LucideCopy, LucideEdit, RefreshCcwDot, ThumbsDown, ThumbsUp, Trash2, Wrench } from "lucide-react";
import Image from "next/image";
import { svg_tool } from "./Messages/ToolUsed";


export default function ChatMessage({ message, index, isLast }: { message: z.infer<typeof message_schema>, index: string, isLast: boolean }) {
    const urls = message.content.match(/(https?:\/\/[^\s]+)/g) || [];
    const formatTime = (timestamp: string) => {
        const d = new Date(timestamp);
        const weekday = d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
        const time = d.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        return `${weekday}, ${time}`;
    }

    return (
        <div
            key={index}
            className={`flex flex-col space-y-4 ${message.role === 'user'
                ? 'items-end animate-slideInRight'
                : 'items-start animate-slideInLeft'
                }`}
        // style={{ animationDelay: `${index * 0.1}s` }}
        >
            {message.role === 'user' ? (
                <>
                    <div className="group relative max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mb-10 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl bg-gray-800">
                        {message.files && message.files.length > 0 && (
                            <div className="mb-2 bg-gray-700 p-2 rounded-lg">
                                <div className="flex flex-wrap gap-2">
                                    {message.files.slice(0, 5).map((file, idx) => (
                                        <div key={idx} className="flex-shrink-0 w-20 h-40 hover:scale-105 transition-transform">
                                            {file.type === 'image' ? (
                                                <Image
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
                        <p className="text-s leading-relaxed font-medium px-5 py-4 group-hover:pb-2 transition-all duration-600 ease-in-out">
                            {message.content}
                        </p>
                        <section className="opacity-0 max-h-0 overflow-hidden text-gray-400 group-hover:opacity-100 group-hover:max-h-20 border-t border-gray-600 px-5 transition-all duration-600 ease-in-out">
                            <div className="flex justify-between items-center py-2">
                                <div className="flex space-x-2">
                                    <LucideEdit className="cursor-pointer border-gray-600 rounded hover:border-1 p-1" />
                                    <LucideCopy className="cursor-pointer border-gray-600 rounded hover:border-1 p-1" />
                                </div>
                                <p>{formatTime(message.timestamp)}</p>
                            </div>
                        </section>
                    </div>
                </>
            ) : (
                <div className="mb-14 group relative">
                    <span className="items-center flex space-x-2 text-green-400 font-medium mb-2">
                        <EarthIcon className="w-6 h-6 text-green-400 mb-2" />
                        <span className="ml-1">Gemini 2.5 pro</span>
                    </span>
                    {message.tools && message.tools.length > 0 && (
                        <div className="m-4 flex flex-col space-y-2">
                            {message.tools.map((tool, idx) => (
                                (tool.name === "web_search" ? (
                                    <span key={idx} className="text-gray-400 cursor-pointer"><Globe className="inline-block mr-1 p-1" /><span className="font-bold">{tool.name}</span> - {tool.status === "in_progress" ? "In Progress" : `Completed (${JSON.parse(tool.output || '{}').results?.length || 0} results found)`}</span>
                                ) : (
                                    <span key={idx} className="text-gray-400 cursor-pointer">{svg_tool[tool.name] || svg_tool.default}<span className="font-bold">{tool.name}</span> - {tool.status === "in_progress" ? "In Progress" : "Completed"}</span>
                                ))
                            ))}
                        </div>
                    )}
                    <div className="group relative max-w-4xl px-5 py-4 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl backdrop-blur-md border-x border-gray-700">
                        <div className="text-s leading-relaxed">
                            <MessageFormat message={message.content === "" ? "No content" : message.content} />
                        </div>
                    </div>
                    <section className="opacity-0 overflow-hidden text-gray-400 group-hover:opacity-100 px-5 transition-all duration-600 ease-in-out">
                        <div className="flex justify-between items-center py-2">
                            {message.status === "completed" && (
                                <>
                                    <div className="flex space-x-2">
                                        <div className="flex space-x-2">
                                            <LucideCopy className="cursor-pointer border-gray-600 rounded hover:border-1 hover:bg-gray-600/40 p-1" />
                                            <GitBranchPlus className="cursor-pointer border-gray-600 rounded hover:border-1 hover:bg-gray-600/40 p-1" />
                                            <RefreshCcwDot className="cursor-pointer border-gray-600 rounded hover:border-1 hover:bg-gray-600/40 p-1" />
                                        </div>
                                        {isLast && (
                                            <>
                                                <div className="w-px h-6 bg-gray-600 mx-2 self-center"></div>
                                                <div className="flex space-x-2">
                                                    <ThumbsUp className="cursor-pointer border-blue-500 rounded hover:border-1 hover:text-blue-300 hover:bg-blue-500/40 p-1" />
                                                    <ThumbsDown className="cursor-pointer border-blue-700 rounded hover:border-1 hover:text-blue-400 hover:bg-blue-600/40 p-1" />
                                                </div>
                                            </>
                                        )}
                                        <div className="w-px h-6 bg-gray-600 mx-2 self-center"></div>
                                        <div className="flex space-x-2">
                                            <LucideBookmarkPlus className="cursor-pointer border-yellow-600 rounded hover:border-1 hover:text-yellow-300 hover:bg-yellow-600/40 p-1" />
                                            <Trash2 className="cursor-pointer border-red-700 rounded hover:border-1 hover:text-red-300 hover:bg-red-600/40 p-1" />
                                        </div>
                                    </div>
                                    <p>{formatTime(message.timestamp)}</p>
                                </>
                            )}
                        </div>
                    </section>
                    {/* {urls.length > 0 && (
                        <div className="w-full mt-2 flex flex-col items-start">
                            {urls.map((url, idx) => (
                                url.includes('youtube.com') || url.includes('youtu.be') ? (
                                    <div key={idx} className="w-full h-full">
                                        <YouTubeEmbed videoUrl={url} />
                                    </div>
                                ) : null
                            ))}
                        </div>
                    )} */}
                </div>
            )}
        </div>
    );
}