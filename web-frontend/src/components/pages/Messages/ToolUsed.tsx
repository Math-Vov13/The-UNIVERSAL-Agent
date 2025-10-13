"use client";
import { JSX } from "react";
import { CodeSquareIcon, Globe, Satellite, Wrench } from "lucide-react";
import { useState } from "react";
import z from "zod";
import { tool_schema } from "@/lib/types/client.schema";

const svg_tool: Record<string, JSX.Element> = {
    web_search: <Globe className="inline-block mr-1 p-1" />,
    code_interpreter: <CodeSquareIcon className="inline-block mr-1 p-1" />,
    get_satellite_position: <Satellite className="inline-block mr-1 p-1" />,
    default: <Wrench className="inline-block mr-1 p-1" />
}

export function ToolUsed({ id, tool }: { id: number, tool: z.infer<typeof tool_schema> }) {
    if (tool.name === "Classification") return null;
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            key={id}
            className={`list-none border-l border-b border-gray-600 rounded-b-md pl-2 ${isOpen ? 'mb-8' : 'bg-gray-800 hover:bg-gray-700 cursor-pointer mb-1'}`}
        >
            <div className={`flex justify-between items-center p-2 cursor-pointer ${isOpen ? 'border-b border-gray-600' : 'bg-transparent'}`} onClick={() => setIsOpen(!isOpen)}>
                <p>{svg_tool[tool.name] || svg_tool.default} <span className="font-semibold">{tool.name}</span>{` (${tool.id.slice(0, 5)}...)`}</p>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </div>
            {isOpen && (
                <div id={`tool-${tool.id}`} className="rounded-md mt-1 p-3 ml-4">
                    <div className="mb-2">
                        <h4 className="text-sm font-bold text-gray-400">Input:</h4>
                        <pre className="text-xs bg-gray-900 p-2 rounded mt-1 overflow-auto">{tool.input === "" ? <span className="text-gray-500">No input provided</span> : JSON.stringify(tool.input, null, 2)}</pre>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-400">Output:</h4>
                        <pre className="text-xs bg-gray-900 p-2 rounded mt-1 overflow-auto">{tool.output === "" ? (tool.status === "in_progress" ? <span className="text-gray-500">Waiting response...</span> : <span className="text-gray-500">No output provided</span>) : JSON.stringify(tool.output, null, 2)}</pre>
                    </div>
                </div>
            )}
        </div>
    );
}