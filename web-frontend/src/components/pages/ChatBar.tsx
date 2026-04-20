"use client";
import { Box, CircleFadingPlus, SendHorizonal, CloudUpload, Paperclip, Brain } from "lucide-react";
import React, { useState, useRef, useEffect, useCallback, ClipboardEventHandler } from "react";
import { useRouter } from 'next/navigation';
import RotatingText from "../RotatingText";
import { useHistory } from "../Providers/historyProvider";
import { AttachmentsTag } from "./AttachmentsTag";

type ChatBarProps = {
    text?: string;
    blocked?: boolean;
    stateBar: "create" | "chat" | "docs";
};

const MaxSizeUpload = 5 * 1024 * 1024;
const MaxTotalSizeUpload = 20 * 1024 * 1024;
const MaxFilesUpload = 5;
const MaxInputLength = 2000;

function ImageThumb({ file, index, onRemove }: { file: File; index: number; onRemove: (i: number) => void }) {
    const [src, setSrc] = useState<string | null>(null);
    useEffect(() => {
        const url = URL.createObjectURL(file);
        setSrc(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    return (
        <div className="relative group w-14 h-14 rounded-lg overflow-hidden border border-purple-800/60 shadow-lg flex-shrink-0 transition-transform duration-200 hover:scale-105">
            {src && (
                <img src={src} alt={file.name} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
                <button
                    type="button"
                    title="Remove"
                    onClick={() => onRemove(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white bg-red-500/80 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                >
                    ×
                </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] truncate px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {file.name}
            </div>
        </div>
    );
}

export default function ChatBarProps({ stateBar, text, blocked }: ChatBarProps) {
    const { isLoading, conversationId, sendMessage, startNewConversation } = useHistory();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const [input, setInput] = useState(text || "");
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [sendRipple, setSendRipple] = useState(false);
    const [reasoningEnabled, setReasoningEnabled] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const dragCounterRef = useRef(0);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const router = useRouter();
    const isLocallyBlocked = blocked || isSubmitting;
    const hasText = input.trim() !== "";
    const hasFiles = !!selectedFiles && selectedFiles.length > 0;

    useEffect(() => {
        chatInputRef.current?.focus();
    }, [conversationId]);

    useEffect(() => {
        const textarea = chatInputRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
        }
    }, [input]);

    const addValidFiles = useCallback((files: File[]) => {
        setSelectedFiles(prevFiles => {
            let totalFiles = prevFiles ? prevFiles.length : 0;
            let totalSize = prevFiles ? Array.from(prevFiles).reduce((acc, f) => acc + f.size, 0) : 0;
            const validFiles: File[] = [];

            for (const file of files) {
                if (!file) continue;
                if (file.size > MaxSizeUpload) { alert(`"${file.name}" dépasse 5 Mo`); continue; }
                if (totalFiles + 1 > MaxFilesUpload) { alert("Maximum 5 fichiers."); break; }
                if (totalSize + file.size > MaxTotalSizeUpload) { alert("Taille totale > 20 Mo"); continue; }
                totalFiles++;
                totalSize += file.size;
                validFiles.push(file);
            }

            const newFiles = [...Array.from(prevFiles || []), ...validFiles];
            if (newFiles.length === 0) return null;
            const dt = new DataTransfer();
            newFiles.forEach(f => dt.items.add(f));
            return dt.files;
        });
    }, []);

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        if (!event.target.files || event.target.files.length === 0) return;
        addValidFiles(Array.from(event.target.files));
    }

    function removeFile(index: number) {
        if (!selectedFiles) return;
        const newFiles = Array.from(selectedFiles);
        newFiles.splice(index, 1);
        const dt = new DataTransfer();
        newFiles.forEach(f => dt.items.add(f));
        setSelectedFiles(dt.files.length > 0 ? dt.files : null);
    }

    const handlePaste: ClipboardEventHandler<HTMLTextAreaElement> = (event) => {
        const items = event.clipboardData?.items;
        if (!items) return;
        const files: File[] = [];
        for (const item of items) {
            if (item.kind === "file") {
                const file = item.getAsFile();
                if (file) files.push(file);
            }
        }
        if (files.length > 0) {
            event.preventDefault();
            addValidFiles(files);
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounterRef.current++;
        if (dragCounterRef.current === 1) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounterRef.current--;
        if (dragCounterRef.current === 0) setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounterRef.current = 0;
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
        if (files.length > 0) addValidFiles(files);
    };

    async function handleFormSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isLoading || isLocallyBlocked) return;
        if (input.trim() === "" && !selectedFiles) return;

        setSendRipple(true);
        setTimeout(() => setSendRipple(false), 500);

        setIsSubmitting(true);
        const capturedInput = input;
        const capturedFiles = selectedFiles;
        setInput("");
        setSelectedFiles(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        try {
            if (stateBar === "chat") {
                await sendMessage(capturedInput, capturedFiles);
            } else {
                const prompt = stateBar === "docs" ? "What are the key points of this document?" : capturedInput;
                const response = await fetch('/api-client/createChat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: prompt }),
                });
                if (!response.ok) {
                    console.error("Error creating chat:", await response.json());
                    return;
                }
                await startNewConversation(capturedInput, capturedFiles);
                const responseData = await response.json();
                setTimeout(() => {
                    router?.push(`/chat/${responseData.conversation_id.toString()}`);
                }, 100);
            }
        } catch (error) {
            console.error("Error submitting chat:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const imageFiles = selectedFiles ? Array.from(selectedFiles).filter(f => f.type.startsWith("image/")) : [];
    const nonImageFiles = selectedFiles ? Array.from(selectedFiles).filter(f => !f.type.startsWith("image/")) : [];

    return (
        <div className="w-full quick-in animate-in slide-in-from-bottom fade-in">
            <div
                ref={wrapperRef}
                className="relative"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {/* Drag & Drop Overlay */}
                <div
                    className={`absolute inset-0 z-20 rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-300 pointer-events-none border-2 border-dashed ${
                        isDragging
                            ? "opacity-100 scale-100 backdrop-blur-sm bg-purple-950/80 border-purple-400/70"
                            : "opacity-0 scale-95 border-transparent"
                    }`}
                >
                    <div className={`transition-transform duration-300 ${isDragging ? "animate-bounce" : ""}`}>
                        <CloudUpload
                            className="w-12 h-12 text-purple-300 drop-shadow-[0_0_12px_rgba(167,139,250,0.8)]"
                            strokeWidth={1.5}
                        />
                    </div>
                    <p className="text-purple-200 font-medium text-base tracking-wide">Déposez vos images ici</p>
                    <p className="text-purple-400 text-xs">PNG, JPG, GIF, WEBP · max 5 Mo / image</p>
                </div>

                {/* Main Form */}
                <form
                    onSubmit={handleFormSubmit}
                    className={`flex flex-col rounded-xl w-full transition-all duration-300 overflow-hidden ${
                        isFocused
                            ? "shadow-[0_0_0_2px_rgba(126,34,206,0.6),0_0_24px_rgba(109,40,217,0.25)] border border-purple-700/80 bg-gray-900/60"
                            : "border border-purple-900/60 bg-gray-900/40 shadow-[0_0_0_1px_rgba(88,28,135,0.3)]"
                    } backdrop-blur-md`}
                    onFocus={() => setIsFocused(true)}
                    onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            setIsFocused(false);
                        }
                    }}
                >
                    {/* Reasoning badge */}
                    <div className={`overflow-hidden transition-all duration-300 ease-out ${reasoningEnabled ? "max-h-10 opacity-100" : "max-h-0 opacity-0"}`}>
                        <div className="px-5 pt-3 flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-900/40 border border-violet-500/40 text-violet-300 text-[11px] font-medium">
                                <Brain className="w-3 h-3 animate-pulse" />
                                <span>Raisonnement approfondi activé</span>
                                <span className="w-1 h-1 rounded-full bg-violet-400 animate-ping" />
                            </div>
                        </div>
                    </div>

                    {/* Textarea */}
                    <div className="px-5 pt-4 pb-1">
                        <textarea
                            ref={chatInputRef}
                            name="chat-input"
                            placeholder="Posez une question, décrivez une tâche…"
                            className="w-full min-h-[48px] max-h-[150px] outline-none text-gray-100 bg-transparent placeholder-purple-500/60 py-1 resize-none leading-relaxed text-sm"
                            value={input}
                            maxLength={MaxInputLength}
                            onChange={(e) => setInput(e.target.value)}
                            onCompositionStart={() => setIsComposing(true)}
                            onCompositionEnd={() => setIsComposing(false)}
                            onPaste={handlePaste}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
                                    e.preventDefault();
                                    handleFormSubmit(e as unknown as React.FormEvent);
                                }
                            }}
                            rows={1}
                        />
                    </div>

                    {/* Image Thumbnails */}
                    {imageFiles.length > 0 && (
                        <div className="px-5 pb-2 flex gap-2 flex-wrap">
                            {imageFiles.map((file, i) => {
                                const realIndex = Array.from(selectedFiles!).indexOf(file);
                                return <ImageThumb key={i} file={file} index={realIndex} onRemove={removeFile} />;
                            })}
                        </div>
                    )}

                    {/* Non-image file tags */}
                    {nonImageFiles.length > 0 && (
                        <div className="px-5 pb-2 flex flex-wrap gap-2">
                            {nonImageFiles.map((file, i) => {
                                const realIndex = Array.from(selectedFiles!).indexOf(file);
                                return <AttachmentsTag key={i} index={realIndex} file={file} onRemove={removeFile} />;
                            })}
                        </div>
                    )}

                    {/* Keyboard hints — slide up when focused */}
                    <div
                        className={`overflow-hidden transition-all duration-300 ease-out ${
                            isFocused ? "max-h-8 opacity-100" : "max-h-0 opacity-0"
                        }`}
                    >
                        <div className="px-5 pb-1 flex items-center gap-3 text-purple-500/60 text-[11px] font-mono tracking-tight select-none">
                            <span className="flex items-center gap-1">
                                <kbd className="bg-purple-900/30 border border-purple-800/40 rounded px-1 py-0.5 text-[10px]">↵</kbd>
                                <span>Envoyer</span>
                            </span>
                            <span className="text-purple-800/60">·</span>
                            <span className="flex items-center gap-1">
                                <kbd className="bg-purple-900/30 border border-purple-800/40 rounded px-1 py-0.5 text-[10px]">Ctrl</kbd>
                                <span>+</span>
                                <kbd className="bg-purple-900/30 border border-purple-800/40 rounded px-1 py-0.5 text-[10px]">↵</kbd>
                                <span>Saut de ligne</span>
                            </span>
                            <span className="text-purple-800/60">·</span>
                            <span className="flex items-center gap-1">
                                <Paperclip className="w-2.5 h-2.5" />
                                <span>Coller une image</span>
                            </span>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="mx-5 h-px bg-purple-900/40" />

                    {/* Bottom toolbar */}
                    <div className="px-4 py-2.5 flex items-center gap-2">
                        {/* Attach button */}
                        <div
                            title="Joindre des images"
                            onClick={!isLocallyBlocked ? () => fileInputRef.current?.click() : undefined}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-purple-400 hover:text-purple-200 hover:bg-purple-900/40 transition-all duration-200 cursor-pointer text-xs font-medium select-none ${
                                isLocallyBlocked ? "pointer-events-none opacity-40" : ""
                            }`}
                        >
                            <input
                                disabled={isLocallyBlocked}
                                ref={fileInputRef}
                                name="file-upload"
                                title="Joindre des images"
                                aria-label="Joindre des images"
                                type="file"
                                accept="image/png,image/gif,image/jpeg,image/jpg,image/webp"
                                className="hidden"
                                multiple
                                onChange={handleFileChange}
                            />
                            <CircleFadingPlus className="w-4 h-4" />
                            <span className="hidden sm:inline">Files</span>
                        </div>

                        {/* Canvas / docs button */}
                        <div
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-purple-400 hover:text-purple-200 hover:bg-purple-900/40 transition-all duration-200 cursor-pointer text-xs font-medium select-none ${
                                isLocallyBlocked ? "pointer-events-none opacity-40" : ""
                            }`}
                        >
                            <Box className="w-4 h-4" />
                            <span className="hidden sm:inline">Canvas</span>
                        </div>

                        {/* Reasoning toggle */}
                        <button
                            type="button"
                            title="Activer le raisonnement approfondi"
                            onClick={() => setReasoningEnabled(v => !v)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer text-xs font-medium select-none border ${
                                reasoningEnabled
                                    ? "bg-violet-900/50 border-violet-500/60 text-violet-200 shadow-[0_0_10px_rgba(139,92,246,0.35)]"
                                    : "border-transparent text-purple-400 hover:text-purple-200 hover:bg-purple-900/40"
                            }`}
                        >
                            <Brain className={`w-4 h-4 transition-all duration-300 ${reasoningEnabled ? "text-violet-300 drop-shadow-[0_0_6px_rgba(167,139,250,0.8)]" : ""}`} />
                            <span className="hidden sm:inline">Reasoning</span>
                            {reasoningEnabled && (
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                            )}
                        </button>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Character counter */}
                        <div
                            className={`text-xs font-mono transition-all duration-300 ${
                                input.length > 50
                                    ? "opacity-100 text-purple-500/70"
                                    : "opacity-0 pointer-events-none"
                            } ${input.length > MaxInputLength * 0.9 ? "text-orange-400" : ""}`}
                        >
                            {input.length} / {MaxInputLength}
                        </div>

                        {/* Send button */}
                        {(hasText || hasFiles) && (
                            <button
                                disabled={isLocallyBlocked}
                                type="submit"
                                name="send-message"
                                title="Envoyer (↵)"
                                onClick={handleFormSubmit}
                                className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 animate-in fade-in zoom-in-75 ${
                                    isLocallyBlocked
                                        ? "opacity-40 cursor-not-allowed bg-purple-900"
                                        : "bg-gradient-to-br from-purple-700 to-violet-600 hover:from-purple-600 hover:to-violet-500 hover:scale-110 shadow-[0_0_12px_rgba(124,58,237,0.5)] hover:shadow-[0_0_20px_rgba(124,58,237,0.7)] cursor-pointer"
                                } overflow-hidden`}
                            >
                                <SendHorizonal className="w-3.5 h-3.5 text-white relative z-10" />
                                {sendRipple && (
                                    <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <RotatingText
                texts={[
                    'Max 5 fichiers · 20 Mo au total.',
                    'Vérifiez toujours les informations données par l\'IA.',
                    'Vous pouvez analyser des documents et des images.',
                    'Glissez-déposez des images directement dans la barre.',
                    'Posez n\'importe quelle question !',
                ]}
                mainClassName="text-xs text-purple-600/50 text-center mt-2 justify-center"
                staggerFrom={"last"}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={8000}
            />
        </div>
    );
}
