"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import z from 'zod';
import { file_schema, message_schema } from '@/lib/types/client.schema';


interface HistoryContextType {
    conversationId: string;
    start: StartType | undefined;
    isLoading: boolean;
    isThinking: boolean;
    isAuthorized: boolean;

    history: z.infer<typeof message_schema>[];
    startNewConversation: (prompt: string, files: FileList | null) => Promise<void>;
    sendMessage: (message: string, files: FileList | null) => Promise<void>;
    clearMessages: () => Promise<void>;
}

type StartType = {
    content: string;
    files: FileList | null;
}

// const getMappedFileType = (mimeType: string): "image" | "text" | "pdf" | "word" | "excel" | "powerpoint" | "code" | "other" => {
//     if (mimeType.startsWith('image/')) return 'image';
//     if (mimeType.startsWith('text/')) return 'text';
//     if (mimeType === 'application/pdf') return 'pdf';
//     if (mimeType === 'application/msword' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'word';
//     if (mimeType === 'application/vnd.ms-excel' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'excel';
//     if (mimeType === 'application/vnd.ms-powerpoint' || mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'powerpoint';
//     if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json')) return 'code';
//     return 'other';
// };

const convert_file_format = async (files: FileList | null): Promise<z.infer<typeof file_schema>[]> => {
    if (!files) return [];
    const filesArray: z.infer<typeof file_schema>[] = [];
    for (let i = 0; files && i < files.length; i++) {
        filesArray.push({
            name: files[i].name,
            size: files[i].size,
            mimeType: files[i].type,
            lastModified: files[i].lastModified,
            type: "image",
            data: files[i],
        });
    }
    return filesArray;
};


const HistoryContext = createContext<HistoryContextType | undefined>(undefined);
export const useHistory = (): HistoryContextType => {
    const context = useContext(HistoryContext);
    if (context === undefined) {
        throw new Error('useHistory must be used within a HistoryProvider');
    }
    return context;
};

export const HistoryProvider = ({ children }: { children: ReactNode }) => {
    const { conv_id } = useParams();
    const conversationId = Array.isArray(conv_id) ? (conv_id[0] ?? "") : (conv_id ?? "");

    const [start, setStart] = useState<StartType | undefined>(undefined);
    const [history, setHistory] = useState<z.infer<typeof message_schema>[]>([]);
    const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isThinking, setIsThinking] = useState<boolean>(false);

    const conversationIdRef = useRef("");
    const messageIdRef = useRef("0");
    const messagesRef = useRef<z.infer<typeof message_schema>[]>([]);
    const isMountedRef = useRef(true);


    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);


    // Fetch conversation history when conversationId changes
    useEffect(() => {
        const fetchConversationHistory = async () => {
            setIsAuthorized(true);
            setIsThinking(false);

            // Reset history if conversationId has changed
            if (conversationIdRef.current !== conversationId) {
                setHistory([]);
                messagesRef.current = [];
                messageIdRef.current = "0";
                conversationIdRef.current = conversationId;
            }

            if (!conversationId) return;
            if (start) {
                await sendMessage(start.content, start.files);
                setStart(undefined);
                return;
            }

            // Validate UUID format (avoid to fetch history if the id is not a valid uuid)
            if (z.uuid({ version: "v4" }).safeParse(conversationId).success === false) {
                setIsAuthorized(false);
                setHistory([]);
                messagesRef.current = [];
                messageIdRef.current = "0";
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch(`/api-client/chat/history?conversation_id=${conversationId}`);
                if (!response.ok) {
                    console.error("Failed to fetch conversation history:", response.statusText);
                    setHistory([]);
                    messagesRef.current = [];
                    messageIdRef.current = "0";
                    setIsLoading(false);
                    setIsAuthorized(false);
                    return;
                }

                setIsAuthorized(true);
                const actualHistory = await response.json() as z.infer<typeof message_schema>[];
                if (actualHistory && actualHistory.length > 0) {
                    const formattedHistory = actualHistory.map((msg, index) => ({
                        ...msg,
                        id: String(index + 1),
                        timestamp: msg.timestamp
                    }));

                    setHistory(formattedHistory);
                    messagesRef.current = formattedHistory;
                    messageIdRef.current = String(formattedHistory.length);
                }
            } catch (error) {
                setHistory([]);
                messagesRef.current = [];
                messageIdRef.current = "0";
                console.error("Error loading conversation history:", error);

            } finally {
                setIsLoading(false);

            }
        };

        fetchConversationHistory();
    }, [conversationId]);


    const startNewConversation = async (prompt: string, files: FileList | null) => {
        setStart({ content: prompt, files });
    }

    const sendMessage = useCallback(async (message: string, files: FileList | null) => {
        const trimmedMessage = message.trim();
        if (!trimmedMessage) return;

        const filesArray = await convert_file_format(files);
        messageIdRef.current += 1;
        const userMessage: z.infer<typeof message_schema> = {
            id: messageIdRef.current,
            role: "user",
            content: trimmedMessage,
            files: filesArray,
            timestamp: new Date().toISOString(),
        };

        const nextMessages = [...messagesRef.current, userMessage];
        messagesRef.current = nextMessages;
        setHistory(nextMessages);

        // Créer le message assistant vide pour le streaming
        messageIdRef.current += 1;
        const assistantMessage: z.infer<typeof message_schema> = {
            id: messageIdRef.current,
            role: "assistant",
            content: "",
            timestamp: new Date().toISOString(),
        };

        // Ajouter le message vide à l'état
        setIsThinking(true);
        setHistory((previous) => {
            const next = [...previous, assistantMessage];
            messagesRef.current = next;
            return next;
        });

        try {
            const response = await fetch("/api-client/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "text/event-stream",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Connection": "keep-alive",
                    "Cache-Control": "no-cache",
                },
                body: JSON.stringify({
                    prompt: trimmedMessage,
                    envPresets: 'default',
                    modelChoice: "auto",
                    conversation_id: conversationId,
                    extra: [],
                    files: await Promise.all(
                        filesArray ?
                            filesArray.map(async f => ({
                                ...f,
                                base64: f.data ? await new Promise<string>((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                        if (typeof reader.result === "string") {
                                            resolve(reader.result);
                                        } else {
                                            reject(new Error("Failed to read file"));
                                        }
                                    };
                                    reader.onerror = () => {
                                        reject(new Error("Failed to read file"));
                                    };
                                    reader.readAsDataURL(f.data as File);
                                }) : undefined,
                                data: undefined, // Ne pas envoyer l'objet File lui-même
                            }))
                            : []
                    ),
                    metadata: {
                        client: "web",
                        clientBuild: "az14BdksjPOA46.2",
                    }
                }),
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error("No reader available");
            }

            let accumulatedContent = "";
            let shouldStop = false;

            while (!shouldStop) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                let actualEvent = '';

                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        actualEvent = line.slice(7).trim();

                    } else if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();

                        if (data === '[DONE]') {
                            shouldStop = true;
                            break;
                        }

                        try {
                            const parsed = JSON.parse(data);

                            const content = parsed.chunk?.text || '';
                            const tool_input = parsed.tool?.input || '';
                            const tool_output = parsed.tool?.output || '';
                            const tool_name = parsed.tool?.name || '';
                            const tool_id = parsed.call_id || '';

                            if (content) {
                                accumulatedContent += content;

                                // Mettre à jour le message en temps réel
                                if (isMountedRef.current) {
                                    setHistory((previous) => {
                                        const updated = [...previous];
                                        const lastIndex = updated.length - 1;
                                        if (lastIndex >= 0 && updated[lastIndex].id === assistantMessage.id) {
                                            updated[lastIndex] = {
                                                ...updated[lastIndex],
                                                content: accumulatedContent,
                                            };
                                        }
                                        messagesRef.current = updated;
                                        return updated;
                                    });
                                }
                            } else if (tool_name && tool_id) {
                                // Handle tool usage updates
                                if (isMountedRef.current) {
                                    setHistory((previous) => {
                                        const updated = [...previous];
                                        const lastIndex = updated.length - 1;
                                        if (lastIndex >= 0 && updated[lastIndex].id === assistantMessage.id) {
                                            const existingTools = updated[lastIndex].tools || [];
                                            const toolIndex = existingTools.findIndex(t => t.id === tool_id);
                                            if (toolIndex !== -1) {
                                                // Update existing tool entry
                                                existingTools[toolIndex] = {
                                                    ...existingTools[toolIndex],
                                                    input: tool_input || existingTools[toolIndex].input,
                                                    output: tool_output || existingTools[toolIndex].output,
                                                    status: tool_output ? 'completed' : 'in_progress',
                                                };
                                            } else {
                                                // Add new tool entry
                                                existingTools.push({
                                                    id: tool_id,
                                                    name: tool_name,
                                                    input: tool_input,
                                                    output: tool_output,
                                                    status: tool_output ? 'completed' : 'in_progress',
                                                });
                                            }
                                            updated[lastIndex] = {
                                                ...updated[lastIndex],
                                                tools: existingTools,
                                            };
                                        }
                                        messagesRef.current = updated;
                                        return updated;
                                    });
                                }
                            }
                        } catch (parseError) {
                            console.warn('Failed to parse SSE data:', parseError);
                        }
                        actualEvent = '';
                    }
                }

                if (shouldStop) {
                    break;
                }
            }

        } catch (error) {
            console.error("Error generating response:", error);

            if (isMountedRef.current) {
                setHistory((previous) => {
                    const updated = [...previous];
                    const lastIndex = updated.length - 1;
                    if (lastIndex >= 0 && updated[lastIndex].id === assistantMessage.id) {
                        updated[lastIndex] = {
                            ...updated[lastIndex],
                            content: "Sorry, an error occurred. Please try again.",
                        };
                    }
                    messagesRef.current = updated;
                    return updated;
                });
            }
        } finally {
            setIsThinking(false);
        }
    }, [conversationId]);

    const clearMessages = async () => {
        setHistory([]);
    };

    const value = {
        conversationId,
        start,
        isLoading,
        isThinking,
        isAuthorized,

        history,
        startNewConversation,
        sendMessage,
        clearMessages,
    };

    return (
        <HistoryContext.Provider value={value}>
            {children}
        </HistoryContext.Provider>
    );
};