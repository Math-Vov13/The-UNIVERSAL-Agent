import z from "zod";
// import { YouTubeEmbed } from "./Messages/YoutubeEmbed";
import MessageFormat from "./Messages/MessageFormat";
import { Badge } from "@/components/ui/badge";
// import { ToolUsed } from "./Messages/ToolUsed";
import { message_schema, tool_schema } from "@/lib/types/client.schema";
import { ArrowDown, EarthIcon, ExternalLink, FlagTriangleRight, GitBranchPlus, Globe, LucideBookmarkPlus, LucideCopy, LucideEdit, MoreHorizontal, RefreshCcwDot, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import Image from "next/image";
import { svg_tool } from "./Messages/ToolUsed";
import TransparentImageWithBackground from "./Messages/Renders/ImageWithBackground";


export default function ChatMessage({ message, index, isLast }: { message: z.infer<typeof message_schema>, index: string, isLast: boolean }) {
    // const urls = message.content.match(/(https?:\/\/[^\s]+)/g) || [];
    const formatTime = (timestamp: string) => {
        const d = new Date(timestamp);
        const weekday = d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
        const time = d.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        return `${weekday}, ${time}`;
    }

    const tools_used = message.content.filter(part => part && 'status' in part && 'name' in part) as unknown as z.infer<typeof tool_schema>[];
    const textPartCount = message.content.filter((part) => !!part && "type" in part && part.type === "text").length;
    const shouldShowNoContentFallback = message.status === "completed" && textPartCount === 0;

    const getSearchResultsCount = (output: unknown): number => {
        if (!output) {
            return 0;
        }

        const resolveResults = (value: unknown): unknown => {
            if (Array.isArray(value)) {
                return value;
            }
            if (value && typeof value === "object") {
                return (value as { results?: unknown }).results ?? [];
            }
            return [];
        };

        if (typeof output === "string") {
            try {
                const parsed = JSON.parse(output);
                const results = resolveResults(parsed);
                return Array.isArray(results) ? results.length : 0;
            } catch (error) {
                console.warn("Failed to parse tool output", error);
                return 0;
            }
        }

        const results = resolveResults(output);
        return Array.isArray(results) ? results.length : 0;
    };

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
                        {message.attachments && message.attachments.length > 0 && (
                            <>
                                <div className="px-5 pt-4">
                                    <span className="items-center flex space-x-2 text-gray-400 font-medium cursor-pointer">Attachments ({message.attachments.length}) <ArrowDown className="ml-2 h-4 w-4" /></span>
                                </div>
                                {/* <div className="mb-2 bg-gray-700 p-2 rounded-lg">
                                    <div className="flex flex-wrap gap-2">
                                        {message.attachments.slice(0, 5).map((file, idx) => (
                                            <div key={idx} className="flex-shrink-0 w-20 h-40 hover:scale-105 transition-transform">
                                                {file.type === 'image' ? (
                                                    <TransparentImageWithBackground classname="">
                                                        <Image
                                                            src={file.data ? URL.createObjectURL(file.data) : `${process.env.NEXT_PUBLIC_CLOUDFRONT}/${file.uri}`}
                                                            alt={`Uploaded file ${idx}`}
                                                            width={150}
                                                            height={150}
                                                            className="w-full h-full object-cover rounded-lg cursor-pointer"
                                                            onClick={() => window.open(`${process.env.NEXT_PUBLIC_CLOUDFRONT}/${file.uri}`, '_blank')}
                                                        />
                                                    </TransparentImageWithBackground>
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
                                </div> */}
                            </>
                        )}
                        <p className="text-s leading-relaxed font-medium px-5 py-4 group-hover:pb-2 transition-all duration-600 ease-in-out">
                            {message.content && message.content[0] && "type" in message.content[0] && message.content[0].type === "text" && message.content[0].text}
                        </p>
                        <section className="opacity-0 max-h-0 overflow-hidden text-gray-400 group-hover:opacity-100 group-hover:max-h-20 border-t border-gray-600 px-5 transition-all duration-600 ease-in-out">
                            <div className="flex justify-between items-center py-2">
                                <div className="flex space-x-2">
                                    <LucideEdit name="edit" className="cursor-pointer border-gray-600 rounded hover:border-1 p-1" />
                                    <LucideCopy name="copy" className="cursor-pointer border-gray-600 rounded hover:border-1 p-1" />
                                </div>
                                <MoreHorizontal name="shortcuts" className="cursor-pointer hover:bg-gray-700 border-gray-500 rounded hover:border-1 p-1" />
                                {/* afficher des boutons simplifiés ex: regénérer la réponse, signaler la réponse, etc. */}
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
                    {tools_used && tools_used.length > 0 && (
                        <div className="m-4 flex flex-col space-y-2">
                            {tools_used.map((tool, idx) => (
                                (tool.name === "web_search" ? (
                                    <span key={idx} className={`text-gray-400 cursor-pointer ${tool.status === "failed" ? "text-red-400" : ""}`}><Globe className="inline-block mr-1 p-1" /><span className="font-bold">&quot;{JSON.parse(tool.input).query ? (JSON.parse(tool.input).query.length > 50 ? JSON.parse(tool.input).query.substring(0, 47) + "..." : JSON.parse(tool.input).query) : "empty"}&quot;</span> - {tool.status === "in_progress" ? "In Progress" : (tool.status === "completed" ? `(${getSearchResultsCount(tool.output)} results found)` : "Failed")}</span>
                                ) : (
                                    <span key={idx} className={`text-gray-400 cursor-pointer ${tool.status === "failed" ? "text-red-400" : ""}`}>{svg_tool[tool.name] || svg_tool.default}<span className="font-bold">{tool.name.replace("_", " ")}</span> - {tool.status === "in_progress" ? "In Progress" : (tool.status === "completed" ? "Completed" : "Failed")}</span>
                                ))
                            ))}
                        </div>
                    )}
                    <div className="group relative max-w-4xl px-5 py-4 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl backdrop-blur-md border-x border-gray-700">
                        {message.content.map((part, idx) => {
                            if (part && "type" in part && part.type === "text") {
                                const rawText = part.text ?? "";
                                const hasVisibleText = rawText.trim().length > 0;

                                if (!hasVisibleText) {
                                    if (message.status === "completed") {
                                        return (
                                            <div key={idx} className="text-s leading-relaxed">
                                                <MessageFormat message="No content" />
                                            </div>
                                        );
                                    }
                                    return null;
                                }

                                return (
                                    <div key={idx} className="text-s leading-relaxed">
                                        <MessageFormat message={rawText} />
                                    </div>
                                );
                            }

                            if (part && "status" in part) {
                                return (
                                    <div key={idx} className="text-s leading-relaxed mt-2 mb-4 flex items-center space-x-2">
                                        {part.name === "web_search" ? (
                                            <Badge className="dark:hover:bg-gray-600/40 dark:hover dark:text-gray-400 dark:bg-gray-800"><span className="font-bold mx-2 hover:underline hover:text-blue-400 hover:cursor-pointer">Recherche Web effectuée</span> <ExternalLink className="text-gray-400" /></Badge>
                                        ) : (
                                            <Badge className="dark:hover:bg-gray-600/40 dark:text-gray-400 dark:bg-gray-800"><span className="font-bold mx-2 hover:underline hover:text-blue-400 hover:cursor-pointer">Tool: {part.name.replace("_", " ")}</span> <ExternalLink className="text-gray-400" /></Badge>
                                        )}
                                    </div>
                                );
                            }

                            return null;
                        })}
                        {shouldShowNoContentFallback && (
                            <div className="text-s leading-relaxed">
                                <MessageFormat message="No content" />
                            </div>
                        )}
                    </div>
                    <section className="opacity-0 overflow-hidden text-gray-400 group-hover:opacity-100 px-5 transition-all duration-600 ease-in-out">
                        <div className="flex justify-between items-center py-2">
                            {message.status === "completed" && (
                                <>
                                    <div className="flex space-x-2">
                                        <div className="flex space-x-2">
                                            <GitBranchPlus name="branch" className="cursor-pointer border-gray-600 rounded hover:border-1 hover:bg-gray-600/40 p-1" />
                                            <LucideCopy name="copy" className="cursor-pointer border-gray-600 rounded hover:border-1 hover:bg-gray-600/40 p-1" />
                                            <RefreshCcwDot name="refresh" className="cursor-pointer border-gray-600 rounded hover:border-1 hover:bg-gray-600/40 p-1" />
                                            <FlagTriangleRight name="report" className="cursor-pointer border-gray-600 rounded hover:border-1 hover:bg-gray-600/40 p-1" />
                                        </div>
                                        {isLast && (
                                            <>
                                                <div className="w-px h-6 bg-gray-600 mx-2 self-center"></div>
                                                <div className="flex space-x-2">
                                                    <ThumbsUp name="thumbsup" className="cursor-pointer border-blue-500 rounded hover:border-1 hover:text-blue-300 hover:bg-blue-500/40 p-1" />
                                                    <ThumbsDown name="thumbsdown" className="cursor-pointer border-blue-700 rounded hover:border-1 hover:text-blue-400 hover:bg-blue-600/40 p-1" />
                                                </div>
                                            </>
                                        )}
                                        <div className="w-px h-6 bg-gray-600 mx-2 self-center"></div>
                                        <div className="flex space-x-2">
                                            <LucideBookmarkPlus name="favorite" className="cursor-pointer border-yellow-600 rounded hover:border-1 hover:text-yellow-300 hover:bg-yellow-600/40 p-1" />
                                            <Trash2 name="delete" className="cursor-pointer border-red-700 rounded hover:border-1 hover:text-red-300 hover:bg-red-600/40 p-1" />
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