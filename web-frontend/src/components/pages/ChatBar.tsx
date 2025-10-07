"use client";
import { Box, CircleFadingPlus, SendHorizonal, X } from "lucide-react";
import React, { useState, useRef } from "react";
import { useRouter } from 'next/navigation';
import RotatingText from "../RotatingText";
import { Badge } from "../ui/badge";

type ChatBarProps = {
    stateBar: "create" | "chat" | "docs";
    handleSubmit?: (message: string, files: FileList | null) => void | Promise<void>;
};


export default function ChatBarProps({ stateBar, handleSubmit }: ChatBarProps) {
    const MaxSizeUpload = 5 * 1024 * 1024; // 5MB
    const MaxTotalSizeUpload = 20 * 1024 * 1024; // 20MB
    const MaxFilesUpload = 5; // 5 files
    const [loading, setLoading] = useState(false);
    const [input, setInput] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const router = useRouter();


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
            // navigator.vibrate(100); cause issues on some devices
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
                        className="flex-grow outline-none text-gray-200 bg-transparent placeholder-purple-400 placeholder:bold border-b border-transparent focus:border-purple-500 transition-all py-2"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                </div>
                <section className={`flex w-full max-w-full items-center justify-start gap-2 px-4 py-2 rounded-lg transition-colors duration-300 ease-in-out ${selectedFiles && selectedFiles.length > 0 ? "bg-gray-950" : "bg-gray-900/40 hover:bg-gray-900/90"}`}>
                    <div title="Attach files" onClick={handlePlusClick} className="h-full justify-start text-purple-500 hover:text-purple-700 cursor-pointer relative">
                        <input
                            disabled={loading}
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
                    <Box className="w-6 h-full text-purple-500 hover:text-purple-700 cursor-pointer" />
                    <div className="w-2"></div>
                    {selectedFiles && selectedFiles.length > 0 && (
                        <div className="flex flex-grow flex-wrap gap-2 max-h-24 overflow-y-auto">
                            {Array.from(selectedFiles).map((file, index) => (
                                <Badge key={index} className="text-sm text-gray-300">
                                    {file.name.length > 20 ? file.name.substring(0, 17) + "..." : file.name}
                                    {file.size > 1024 * 1024 ? ` (${(file.size / (1024 * 1024)).toFixed(2)} MB)` : file.size > 1024 ? ` (${(file.size / 1024).toFixed(2)} KB)` : ` (${file.size} B)`}
                                    <button
                                        title="Remove file"
                                        type="button"
                                        className="ml-1 text-gray-400 hover:text-purple-500 cursor-pointer hover:scale-110 transition-all"
                                        onClick={() => removeFile(index)}
                                    >
                                        <X />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}

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