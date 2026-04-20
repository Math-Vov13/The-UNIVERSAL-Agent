"use client";
import { Box, CircleFadingPlus, SendHorizonal, X, Paperclip } from "lucide-react";
import React, { useState, useRef, useEffect, ClipboardEventHandler } from "react";
import { useRouter } from 'next/navigation';
import RotatingText from "../RotatingText";
import { useHistory } from "../Providers/historyProvider";
import { AttachmentsTag } from "./AttachmentsTag";
// import {
//     PromptInput,
//     PromptInputTextarea,
//     PromptInputFooter,
//     PromptInputTools,
//     PromptInputButton,
//     PromptInputSubmit,
//     PromptInputAttachments,
//     PromptInputAttachment,
//     usePromptInputAttachments,
//     PromptInputActionMenu,
//     PromptInputActionMenuTrigger,
//     PromptInputActionMenuContent,
//     PromptInputActionAddAttachments,
// } from "@/components/ai-elements/prompt-input";

type ChatBarProps = {
    text?: string;
    blocked?: boolean;
    stateBar: "create" | "chat" | "docs";
};


// Limitations
const MaxSizeUpload = 5 * 1024 * 1024; // 5MB
const MaxTotalSizeUpload = 20 * 1024 * 1024; // 20MB
const MaxFilesUpload = 5; // 5 files

export default function ChatBarProps({ stateBar, text, blocked }: ChatBarProps) {
    const { isLoading, conversationId, sendMessage, startNewConversation } = useHistory();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const [input, setInput] = useState(text || "");
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    // const [isFocused, setIsFocused] = useState(false);
    const router = useRouter();
    const isLocallyBlocked = blocked || isSubmitting;

    // Always focus the input when the component is mounted or when the conversationId changes
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

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        if (!event.target.files || event.target.files.length === 0) return;
        let totalFiles = selectedFiles ? selectedFiles.length : 0;
        let totalSize = selectedFiles ? Array.from(selectedFiles).reduce((acc, file) => acc + file.size, 0) : 0;
        const validFiles: File[] = [];

        for (let i = 0; i < event.target.files.length; i++) {
            if (event.target.files[i] == null) continue;
            // Verify file size
            if (event.target.files[i].size > MaxSizeUpload) {
                alert(`File ${event.target.files[i].name} size exceeds 5MB`);
                continue;
            }
            // Verify total files count
            if (totalFiles + 1 > MaxFilesUpload) {
                alert("You can upload a maximum of 5 files at once.");
                break;
            }
            // Verify total files size
            if (totalSize + event.target.files[i].size > MaxTotalSizeUpload) {
                alert("Total file size exceeds 20MB");
                continue;
            }

            // Add file
            totalFiles += 1;
            totalSize += event.target.files[i].size;
            validFiles.push(event.target.files[i]);
        }


        setSelectedFiles(prevFiles => {
            const newFiles = Array.from(prevFiles || []);
            newFiles.push(...Array.from(validFiles || []));

            if (newFiles.length === 0) return null;

            const dataTransfer = new DataTransfer();
            newFiles.forEach(file => dataTransfer.items.add(file));
            return dataTransfer.files;
        });
    }

    function removeFile(index: number) {
        if (!selectedFiles) return;
        const newFiles = Array.from(selectedFiles);
        newFiles.splice(index, 1);
        const dataTransfer = new DataTransfer();
        newFiles.forEach(file => dataTransfer.items.add(file));
        setSelectedFiles(dataTransfer.files);
    }

    const handlePlusClick = () => {
        fileInputRef.current?.click();
    };

    const handlePaste: ClipboardEventHandler<HTMLTextAreaElement> = (event) => {
        const items = event.clipboardData?.items;

        if (!items) {
            return;
        }

        const files: File[] = [];

        for (const item of items) {
            if (item.kind === "file") {
                const file = item.getAsFile();
                if (file) {
                    files.push(file);
                }
            }
        }

        if (files.length > 0) {
            event.preventDefault();
            let totalFiles = selectedFiles ? selectedFiles.length : 0;
            let totalSize = selectedFiles ? Array.from(selectedFiles).reduce((acc, file) => acc + file.size, 0) : 0;
            const validFiles: File[] = [];

            for (let i = 0; i < files.length; i++) {
                if (files[i] == null) continue;
                // Verify file size
                if (files[i].size > MaxSizeUpload) {
                    alert(`File ${files[i].name} size exceeds 5MB`);
                    continue;
                }
                // Verify total files count
                if (totalFiles + 1 > MaxFilesUpload) {
                    alert("You can upload a maximum of 5 files at once.");
                    break;
                }
                // Verify total files size
                if (totalSize + files[i].size > MaxTotalSizeUpload) {
                    alert("Total file size exceeds 20MB");
                    continue;
                }

                // Add file
                totalFiles += 1;
                totalSize += files[i].size;
                validFiles.push(files[i]);
            }

            setSelectedFiles(prevFiles => {
                const newFiles = Array.from(prevFiles || []);
                newFiles.push(...Array.from(validFiles || []));

                if (newFiles.length === 0) return null;

                const dataTransfer = new DataTransfer();
                newFiles.forEach(file => dataTransfer.items.add(file));
                return dataTransfer.files;
            });
        }
    };

    async function handleFormSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isLoading) return;
        if (isLocallyBlocked) return;
        if (input.trim() === "" && !selectedFiles) return;
        setIsSubmitting(true);
        setInput("");
        setSelectedFiles(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        try {
            if (stateBar === "chat") {
                await sendMessage(input, selectedFiles);

            } else {
                const prompt = stateBar === "docs" ? "What are the key points of this document?" : input;
                const response = await fetch('/api-client/createChat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: prompt,
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("Error creating chat:", errorData);
                    return;
                }

                await startNewConversation(input, selectedFiles);
                const responseData = await response.json();
                setTimeout(() => {
                    router?.push(`/chat/${responseData.conversation_id.toString()}`);
                }, 100);
                // window.history.pushState(null, '', `/chat/${responseData.conversation_id.toString()}`)
            }

        } catch (error) {
            console.error("Error submitting chat:", error);

        } finally {
            setIsSubmitting(false);

        }
    }


    return (
        <div className="w-full quick-in animate-in slide-in-from-bottom fade-in">
            <form className="flex flex-col border border-purple-900 bg-gray-900/40 backdrop-blur-md rounded-lg border-2 px-8 py-5 w-full focus-within:border-4 transition-all">
                <div className="flex items-center mb-2 px-4 py-2">
                    {/* <PromptInput>
                        <PromptInputTextarea ref={chatInputRef} />
                    </PromptInput> */}
                    <textarea
                        ref={chatInputRef}
                        name="chat-input"
                        placeholder="Type what you want to say..."
                        className="flex-grow min-h-12 outline-none text-gray-200 bg-transparent placeholder-purple-400 border-b border-transparent focus:border-purple-500 transition-all py-2 resize-none field-sizing-content"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onCompositionStart={ () => setIsComposing(true)}
                        onCompositionEnd={() => setIsComposing(false)}
                        onPaste={ handlePaste }
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
                                e.preventDefault();
                                handleFormSubmit(e as React.FormEvent);
                            }
                        }}
                        rows={1}
                    />
                </div>
                <section className={`flex w-full max-w-full items-center justify-start gap-2 px-2 rounded-lg transition-colors transform duration-300 ease-in-out ${selectedFiles && selectedFiles.length > 0 && "bg-gray-950"}`}>
                    <section className={`px-4 py-2 flex items-center rounded-3xl transition-colors duration-300 ease-in-out max-w-full flex-wrap gap-2 ${selectedFiles && selectedFiles.length > 0 ? "" : "bg-gray-900/60 hover:bg-gray-900/90"}`}>
                        <div title="Attach files" onClick={handlePlusClick} className={`h-full justify-start text-purple-500 hover:text-purple-700 cursor-pointer relative ${isLocallyBlocked ? "pointer-events-none opacity-50" : ""}`}>
                            <input
                                disabled={isLocallyBlocked}
                                ref={fileInputRef}
                                title="Attach files"
                                name="file-upload"
                                type="file"
                                accept="image/png,image/gif,image/jpeg,image/jpg,image/webp"//,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/csv,text/comma-separated-values,application/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,application/json,application/jsonl,application/xml,text/html,text/css,application/x-javascript,text/javascript,text/markdown,text/x-python-script,text/python,text/markdown"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <CircleFadingPlus />
                        </div>
                        <div className="w-2"></div>
                        <Box className={`w-6 h-full text-purple-500 hover:text-purple-700 cursor-pointer ${isLocallyBlocked ? "pointer-events-none opacity-50" : ""}`} />
                        {selectedFiles && selectedFiles.length > 0 && (
                            <>
                                <div className="w-2"></div>
                                <div className="flex flex-grow flex-wrap gap-2 max-h-24 overflow-y-auto">
                                    {Array.from(selectedFiles).map((file, index) => (
                                        <AttachmentsTag key={index} index={index} file={file} onRemove={removeFile} />
                                    ))}
                                </div>
                            </>
                        )}
                    </section>

                    {/* <div className="flex-grow"></div> */}

                    {(input.trim() !== "") && (
                        <>
                            {selectedFiles && selectedFiles.length > 0 && (<div className="flex-grow"></div>)}
                            <div className="w-px h-6 bg-purple-600 mx-2 self-center"></div>
                            <button
                                disabled={isLocallyBlocked}
                                type="submit"
                                name="send-message"
                                title="Send message"
                                className="text-purple-500 hover:text-purple-800 cursor-pointer transition-all duration-500 animate-in slide-in-from-left fade-in"
                                onClick={handleFormSubmit}
                            >
                                <SendHorizonal />
                            </button>
                        </>
                    )}
                </section>
            </form>
            <RotatingText
                texts={['You can attach a maximum of 5 files at once.', 'Remember to verify the information given by AI.', 'You can ask me to analyze documents for you.', 'You can upload images, PDFs, Word documents, Excel files, and more.', 'Feel free to ask me anything!']}
                mainClassName="text-sm text-gray-500 text-center mt-2 justify-center"
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