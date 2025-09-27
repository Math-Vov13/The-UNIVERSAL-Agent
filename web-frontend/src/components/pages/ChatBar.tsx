"use client";
import { Box, CircleFadingPlus, SendHorizonal } from "lucide-react";
import React, { useState, useRef } from "react";
import { useRouter } from 'next/navigation';
import RotatingText from "../RotatingText";

type ChatBarProps = {
    stateBar: "create" | "chat" | "docs";
    handleSubmit?: (message: string, files: FileList | null) => void | Promise<void>;
};


export default function ChatBarProps({ stateBar, handleSubmit }: ChatBarProps) {
    const [loading, setLoading] = useState(false);
    const [input, setInput] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const router = useRouter();


    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        setSelectedFiles(event.target.files);
    }

    const handlePlusClick = () => {
        fileInputRef.current?.click();
    };


    async function handleFormSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (loading) return;
        if (input.trim() === "" && !selectedFiles) return;
        setLoading(true);

        try {
            if (handleSubmit) {
                await Promise.resolve(handleSubmit(input, selectedFiles));

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

                const responseData = await response.json();
                setTimeout(() => {
                    const params = new URLSearchParams();
                    params.set('first', input);
                    router?.push(`/chat/${responseData.conversation_id.toString()}?${params.toString()}`);
                }, 100);
                // window.history.pushState(null, '', `/chat/${responseData.conversation_id.toString()}`)
            }

            setInput("");
            setSelectedFiles(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

        } catch (error) {

            console.error("Error submitting chat:", error);

        } finally {
            navigator.vibrate(100);
            setLoading(false);
        }
    }


    return (
        <div className="w-full">
            <form className="flex flex-col border border-purple-900 bg-gray-900/40 backdrop-blur-md rounded-lg border-2 px-8 py-5 w-full focus-within:border-4 transition-all">
                <div className="flex items-center mb-2 px-4 py-2">
                    <input
                        disabled={loading}
                        name="chat-input"
                        type="text"
                        placeholder="Hey, how can I assist you today?"
                        className="flex-grow outline-none text-gray-200 bg-transparent placeholder-purple-400 placeholder:bold"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                </div>
                <section className="flex w-full max-w-full items-center justify-start gap-2 bg-gray-950 px-4 py-2 rounded-lg">
                    <div title="Attach files" onClick={handlePlusClick} className="h-full justify-start text-purple-500 hover:text-purple-700 cursor-pointer relative">
                        <input
                            disabled={loading}
                            ref={fileInputRef}
                            title="Attach files"
                            name="file-upload"
                            type="file"
                            accept="image/png,image/gif,image/jpeg,image/jpg,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/csv,text/comma-separated-values,application/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,application/json,application/jsonl,application/xml,text/html,text/css,application/x-javascript,text/javascript,text/markdown,text/x-python-script,text/python,text/markdown"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <CircleFadingPlus />
                    </div>
                    <div className="w-2"></div>
                    <Box className="w-6 h-full text-purple-500 hover:text-purple-700 cursor-pointer" />

                    <div className="flex-grow"></div>

                    {(input.trim() !== "") && (
                        <button
                            disabled={loading}
                            type="submit"
                            name="send-message"
                            title="Send message"
                            className="text-purple-500 hover:text-blue-700 cursor-pointer transition-all duration-500 animate-in fade-in"
                            onClick={handleFormSubmit}
                        >
                            <SendHorizonal />
                        </button>
                    )}
                </section>
            </form>
            <RotatingText
              texts={['You can attach multiple files at once.', 'Remember to verify the information given by AI.', 'You can ask me to analyze documents for you.', 'You can upload images, PDFs, Word documents, Excel files, and more.', 'Feel free to ask me anything!']}
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