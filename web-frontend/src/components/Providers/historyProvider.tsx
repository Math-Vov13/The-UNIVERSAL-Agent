"use client";
import React, { createContext, useContext, ReactNode, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import z from 'zod';
import { file_schema, message_schema, tool_schema } from '@/lib/types/client.schema';
import { create } from 'zustand';


interface HistoryContextType {
    conversationId: string;
    start: StartType | undefined;
    error: boolean;
    isLoading: boolean;
    isWorking: boolean;
    isAuthorized: boolean;

    history: z.infer<typeof message_schema>[];
    retrySendMessage: () => Promise<void>;
    startNewConversation: (prompt: string, files: FileList | null) => Promise<void>;
    sendMessage: (message: string, files?: FileList | null, preparedFiles?: z.infer<typeof file_schema>[]) => Promise<void>;
    clearMessages: () => Promise<void>;
}

type StartType = {
    content: string;
    files: FileList | null;
}

const getMappedFileType = (mimeType?: string): "image" | "text" | "pdf" | "word" | "excel" | "powerpoint" | "code" | "other" => {
    if (!mimeType) return 'other';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('text/')) return 'text';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType === 'application/msword' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'word';
    if (mimeType === 'application/vnd.ms-excel' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'excel';
    if (mimeType === 'application/vnd.ms-powerpoint' || mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'powerpoint';
    if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json')) return 'code';
    return 'other';
};

const convert_file_format = async (files: FileList | null): Promise<z.infer<typeof file_schema>[]> => {
    if (!files) return [];
    const filesArray: z.infer<typeof file_schema>[] = [];
    for (let i = 0; files && i < files.length; i++) {
        filesArray.push({
            name: files[i].name,
            size: files[i].size,
            mimeType: files[i].type,
            lastModified: files[i].lastModified,
            type: getMappedFileType(files[i].type),
            data: files[i],
        });
    }
    return filesArray;
};


const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

type HistoryStore = {
    start?: StartType;
    error: boolean;
    history: z.infer<typeof message_schema>[];
    isAuthorized: boolean;
    isLoading: boolean;
    isWorking: boolean;
    setStart: (value?: StartType) => void;
    setError: (value: boolean) => void;
    setHistory: (value: z.infer<typeof message_schema>[]) => void;
    updateHistory: (updater: (value: z.infer<typeof message_schema>[]) => z.infer<typeof message_schema>[]) => void;
    setIsAuthorized: (value: boolean) => void;
    setIsLoading: (value: boolean) => void;
    setIsWorking: (value: boolean) => void;
};

const useHistoryStore = create<HistoryStore>((set) => ({
    start: undefined,
    error: false,
    history: [],
    isAuthorized: true,
    isLoading: false,
    isWorking: false,
    setStart: (value) => set({ start: value }),
    setError: (value) => set({ error: value }),
    setHistory: (value) => set({ history: value }),
    updateHistory: (updater) => set((state) => ({ history: updater(state.history) })),
    setIsAuthorized: (value) => set({ isAuthorized: value }),
    setIsLoading: (value) => set({ isLoading: value }),
    setIsWorking: (value) => set({ isWorking: value }),
}));

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

    const {
        start,
        error,
        history,
        isAuthorized,
        isLoading,
        isWorking,
        setStart,
        setError,
        setHistory,
        updateHistory,
        setIsAuthorized,
        setIsLoading,
        setIsWorking,
    } = useHistoryStore();

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
            setError(false);
            setIsAuthorized(true);
            setIsWorking(false);

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
    const retrySendMessage = useCallback(async () => {
        if (error) {
            const lastMessage = history[history.length - 2];
            if (lastMessage) {
                updateHistory((prev) => prev.slice(0, -2));
                messagesRef.current = messagesRef.current.slice(0, -2);
                messageIdRef.current = String(Number(messageIdRef.current) - 2);
                if (lastMessage.content[0] && "text" in lastMessage.content[0]) {
                    await sendMessage(lastMessage.content[0].text, undefined, lastMessage.attachments);
                }
            }
        }
    }, [error]);

    const sendMessage = useCallback(async (message: string, files?: FileList | null, preparedFiles?: z.infer<typeof file_schema>[]) => {
        const trimmedMessage = message.trim();
        if (!trimmedMessage) return;

        const filesArray = files ? await convert_file_format(files) : (preparedFiles || []);
        messageIdRef.current = String(Number(messageIdRef.current || "0") + 1);
        const userMessage: z.infer<typeof message_schema> = {
            id: messageIdRef.current,
            role: "user",
            content: [
                {
                    type: "text",
                    text: trimmedMessage
                }
            ],
            attachments: filesArray,
            timestamp: new Date().toISOString(),
        };

        const nextMessages = [...messagesRef.current, userMessage];
        messagesRef.current = nextMessages;
        setError(false);
        setHistory(nextMessages);

        // Créer le message assistant vide pour le streaming
        messageIdRef.current = String(Number(messageIdRef.current || "0") + 1);
        const assistantMessageId = messageIdRef.current;
        let assistantContent: z.infer<typeof message_schema>["content"] = [];
        const assistantMessage: z.infer<typeof message_schema> = {
            id: assistantMessageId,
            role: "assistant",
            content: assistantContent,
            status: "pending",
            timestamp: new Date().toISOString(),
        };

        // Ajouter le message vide à l'état
        setIsWorking(true);
        updateHistory((previous) => {
            const next = [...previous, assistantMessage];
            messagesRef.current = next;
            return next;
        });

        let currentTextBlockIndex: number | null = null;

        const syncAssistantMessage = (nextContent: z.infer<typeof message_schema>["content"], nextStatus?: "pending" | "completed" | "failed") => {
            assistantContent = nextContent;
            if (!isMountedRef.current) {
                return;
            }

            updateHistory((previous) => {
                const updated = [...previous];
                const targetIndex = updated.findIndex((msg) => msg.id === assistantMessageId);
                if (targetIndex === -1) {
                    return previous;
                }

                const targetMessage = updated[targetIndex];
                const patchedMessage = {
                    ...targetMessage,
                    content: nextContent,
                    status: nextStatus ?? targetMessage.status,
                };

                updated[targetIndex] = patchedMessage;
                messagesRef.current = updated;
                return updated;
            });
        };

        const appendTextBlock = (initialText: string) => {
            if (!initialText || initialText.length === 0) {
                return;
            }
            const nextEntry: z.infer<typeof message_schema>["content"][number] = {
                type: "text",
                text: initialText,
            };

            const nextContent = [...assistantContent, nextEntry];
            currentTextBlockIndex = nextContent.length - 1;
            syncAssistantMessage(nextContent);
        };

        const appendToCurrentTextBlock = (delta: string) => {
            if (!delta || delta.length === 0) {
                return;
            }
            if (currentTextBlockIndex === null) {
                appendTextBlock(delta);
                return;
            }

            const currentEntry = assistantContent[currentTextBlockIndex];

            if (!currentEntry || !('type' in currentEntry) || currentEntry.type !== "text") {
                appendTextBlock(delta);
                return;
            }

            const updatedEntry = {
                ...currentEntry,
                text: (currentEntry.text ?? "") + delta,
            };

            const nextContent = assistantContent.map((item, index) => index === currentTextBlockIndex ? updatedEntry : item);
            syncAssistantMessage(nextContent);
        };

        const normalizeToolField = (value: unknown) => {
            if (value === undefined || value === null) {
                return "";
            }

            if (typeof value === "string") {
                return value;
            }

            try {
                return JSON.stringify(value);
            } catch (serializationError) {
                console.warn("Failed to serialize tool field", serializationError);
                return "";
            }
        };

        const upsertTool = (toolId: string, toolName: string, toolInput: unknown, toolOutput: unknown, statusHint?: "in_progress" | "completed" | "failed") => {
            if (!toolId) {
                return;
            }

            const normalizedInput = normalizeToolField(toolInput);
            const normalizedOutput = normalizeToolField(toolOutput);
            const now = new Date().toISOString();

            const existingIndex = assistantContent.findIndex((item) => item && typeof item === "object" && "call_id" in item && (item as z.infer<typeof tool_schema>).call_id === toolId);

            if (existingIndex === -1) {
                const existingTools = assistantContent.filter((item): item is z.infer<typeof tool_schema> => !!item && typeof item === "object" && "call_id" in item);
                const nextTool: z.infer<typeof tool_schema> = {
                    index: existingTools.length,
                    call_id: toolId,
                    name: toolName,
                    input: normalizedInput,
                    output: normalizedOutput,
                    status: statusHint ?? (normalizedOutput ? "completed" : "in_progress"),
                    start_timestamp: now,
                    timestamp: now,
                };

                const nextContent = [...assistantContent, nextTool];
                currentTextBlockIndex = null;
                syncAssistantMessage(nextContent);
                return;
            }

            const currentTool = assistantContent[existingIndex] as z.infer<typeof tool_schema>;
            const nextTool = {
                ...currentTool,
                input: normalizedInput || currentTool.input,
                output: normalizedOutput || currentTool.output,
                status: statusHint ?? (normalizedOutput ? "completed" : currentTool.status),
                timestamp: now,
            };

            const nextContent = assistantContent.map((item, index) => index === existingIndex ? nextTool : item);
            syncAssistantMessage(nextContent);
        };

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
                setError(true);
                if (response.status === 403) {
                    setIsAuthorized(false);
                }
                throw new Error(`Request failed with status ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error("No reader available");
            }

            let shouldStop = false;
            let pendingBuffer = "";

            while (!shouldStop) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                pendingBuffer += chunk;
                const lines = pendingBuffer.split('\n');
                pendingBuffer = lines.pop() ?? "";

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();

                        if (data === '[DONE]') {
                            shouldStop = true;
                            break;
                        }

                        try {
                            const parsed = JSON.parse(data);

                            const operation = parsed.o as string | undefined;
                            const chunkParts = parsed.chunk?.parts as Array<{ type?: string; text?: string }> | undefined;
                            const chunkText = parsed.chunk?.text as string | undefined;
                            const toolName = parsed.tool?.name as string | undefined;
                            const toolInput = parsed.tool?.input;
                            const toolOutputPayload = parsed.tool?.output ?? parsed.error;
                            const toolId = parsed.call_id as string | undefined;
                            const hasError = parsed.error !== undefined && parsed.error !== null;

                            if (Array.isArray(chunkParts) && chunkParts.length > 0) {
                                for (const part of chunkParts) {
                                    if (part?.type === "text") {
                                        appendTextBlock(part.text ?? "");
                                    }
                                }
                                continue;
                            }

                            if (typeof chunkText === "string" && chunkText.length > 0) {
                                appendToCurrentTextBlock(chunkText);
                                continue;
                            }

                            if (toolName && toolId) {
                                let status: "in_progress" | "completed" | "failed" | undefined;
                                if (operation === "update") {
                                    status = hasError ? "failed" : toolOutputPayload !== undefined ? "completed" : undefined;
                                }

                                upsertTool(toolId, toolName, toolInput, toolOutputPayload, status);
                                continue;
                            }
                        } catch (parseError) {
                            console.warn('Failed to parse SSE data:', parseError);
                        }
                    }
                }

                if (shouldStop) {
                    break;
                }
            }
            syncAssistantMessage(assistantContent, "completed");


        } catch (error) {
            console.error("Error generating response:", error);

            assistantContent = [{
                type: "text",
                text: "Sorry, an error occurred. Please try again.",
            }];
            syncAssistantMessage(assistantContent, "failed");
        } finally {
            setIsWorking(false);
        }
    }, [conversationId]);

    const clearMessages = async () => {
        setHistory([]);
    };

    const value = {
        conversationId,
        start,
        error,
        isLoading,
        isWorking,
        isAuthorized,

        history,
        retrySendMessage,
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