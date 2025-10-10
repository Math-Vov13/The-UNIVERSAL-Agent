import { getConversation, saveMessage, updateMessage } from "@/lib/db";
import { tool_schema } from "@/lib/types/db.schema";
import z from "zod";

const fileSchema = z.object({
    name: z.string(),
    size: z.number().max(5 * 1024 * 1024), // Max 5MB
    mimeType: z.string(),
    type: z.string(),
    base64: z.string()
});

const entry_schema = z.object({
    prompt: z.string().min(1).max(7000),
    conversation_id: z.uuidv4(),
    extra: z.array(z.any().optional()).optional(),
    files: z.array(fileSchema.optional()).max(5).optional()
})

type MessageContent = {
    role: "user" | "assistant";
    content: string;
}

type ApiRequestBody = {
    prompt: string;
    history: MessageContent[];
    files: z.infer<typeof fileSchema>[];
}


export async function POST(req: Request) {

    // Validate headers
    // (411) Length Required
    if (req.headers.get("Content-Length") === null) {
        return new Response(JSON.stringify({ error: "Content-Length header is required" }), { status: 411 });
    }

    // (412) Precondition Failed
    if (req.headers.get("Content-Type") !== "application/json") {
        return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), { status: 412 });
    }
    if (req.headers.get("Accept") === null) {
        return new Response(JSON.stringify({ error: "Accept header is required" }), { status: 412 });
    }
    if (req.headers.get("Accept") !== "*/*" && !req.headers.get("Accept")?.includes("text/event-stream")) {
        return new Response(JSON.stringify({ error: "You must use text/event-stream" }), { status: 412 });
    }

    const request = entry_schema.safeParse(await req.json());
    if (!request.success) {
        console.error("Invalid request body:", request.error);
        return new Response(JSON.stringify({ error: "Invalid Body Format" }), { status: 422 });
    }



    const { prompt, conversation_id } = request.data;
    const history = await getConversation(conversation_id);
    const user_limits = {
        "web_search": {
            "active": true,
            "limits": {
                "daily": 100,
                "monthly": 3000
            }
        },
        "file_upload": {
            "active": false,
            "limits": {
                "daily": 0,
                "monthly": 0
            }
        }
    }

    try {
        const response: Response = await fetch(`${process.env.BACKEND_BASE_URL}/generation/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Cache-Control": "no-cache",
            },
            body: JSON.stringify({
                prompt,
                history: history.map((msg): MessageContent => ({ content: msg.content, role: msg.role })),
                files: request.data.files || []
            } as ApiRequestBody),
        });

        if (!response.ok) {
            console.error("Backend response not ok:", await response.text());
            throw new Error("Failed to fetch");
        }

        const user_message_id = await saveMessage(conversation_id, {
            id: "0",
            version: 1,
            role: "user",
            content: prompt,
            timestamp: new Date().toISOString()
        });
        const assistant_message_id = await saveMessage(conversation_id, {
            id: "0",
            version: 1,
            role: "assistant",
            content: "",
            status: "pending",
            timestamp: new Date().toISOString()
        });

        // Set up streaming response with proper SSE format
        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body?.getReader();
                if (!reader) {
                    controller.close();
                    return;
                }

                let completeResponse = "";
                const tools_used: z.infer<typeof tool_schema>[] = [];
                let stage = 0; // Index to track the current stage of the response
                let tool_calls_stage = []; // Array to track tool calls per stage

                try {
                    // Start enconding initial metadata events
                    controller.enqueue(new TextEncoder().encode(`event: startup\ndata: ${JSON.stringify({
                        type: "startup", version: "1.0.0", "subscription": "pro", "user_auth": "token:15sd6q4665da7987za8d9s7q8sqd", "tools": user_limits, "model_choosed": "auto"
                    })}\n\n`));

                    // Start reading the response stream
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            // Send final DONE message
                            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "summary", conversation_id, new_envPresets: ["dark_mode", "notifications_on"], total_time: 120, total_tokens: 1500, docs_tokens: 300, tools_tokens: 200 })}\n\n`));
                            controller.enqueue(new TextEncoder().encode(`event: limits\ndata: ${JSON.stringify({ type: "limits", conversation_id, web_search: { used: 50, remaining: 50, monthly_used: 1500, monthly_remaining: 1500 }, reasoning: { used: 10, remaining: 10 }, models: { "gpt-4": { used: 1000, remaining: 2000 }, "gpt-3.5": { used: 500, remaining: 5000 } }, tokens: { used: 12000, remaining: 8000 } })}\n\n`));
                            break;
                        }

                        const text = new TextDecoder().decode(value);
                        const lines = text.split('\n').filter(line => line.trim().startsWith('data:'));

                        for (const line of lines) {
                            try {
                                const jsonStr = line.substring(5).trim();
                                if (jsonStr === "[DONE]") break;

                                const jsonData = JSON.parse(jsonStr);
                                const chunkType = jsonData.type as string | undefined;
                                if (chunkType == "content_moderation") {
                                    // NOTICE: Just appear once at the beginning of the stream
                                    controller.enqueue(new TextEncoder().encode(`event: session\ndata: ${JSON.stringify({ type: "session", conversation_id, message_id: assistant_message_id, parent_id: user_message_id, moderate: jsonData.moderate === null ? "safe" : jsonData.moderate })}\n\n`));
                                    continue;
                                }

                                if (chunkType == "chat_model_start") {
                                    stage++;
                                    tool_calls_stage = [];

                                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ run_id: jsonData.run_id, m: jsonData.graph_node._provider + "/" + jsonData.graph_node._name, version: 0, o: "add", p: `/message/content/parts/${stage}`, chunk: { parts: [{ type: "text", text: "" }] } })}\n\n`));
                                    continue;

                                } else if (chunkType == "chat_model_stream") {
                                    completeResponse += jsonData.parts[0].text; // save response to History

                                    controller.enqueue(new TextEncoder().encode(`event: delta\ndata: ${JSON.stringify({ o: "append", chunk: { text: jsonData.parts[0].text, sources: undefined } })}\n\n`));
                                    // Start Tool Call Events
                                    if (jsonData.tool_calls && Array.isArray(jsonData.tool_calls)) {
                                        for (const tool_call of jsonData.tool_calls) {
                                            tool_calls_stage.push({ id: tool_call.id, stage: tool_calls_stage.length });
                                            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ run_id: jsonData.run_id, version: 0, call_id: tool_call.id, "o": "add", "p": `/message/content/tools/${stage}/${tool_calls_stage.length - 1}`, error: null, tool: { name: tool_call.name, input: JSON.stringify(tool_call.args) } })}\n\n`));
                                        }
                                    }
                                    continue;

                                } else if (chunkType == "tool_end") {
                                    const toolIndexTable = tool_calls_stage.findIndex(call => call.id === jsonData.tool_id);
                                    let tool_stage = -1;
                                    if (toolIndexTable > -1) {
                                        tool_stage = tool_calls_stage[toolIndexTable].stage;
                                    }
                                    tools_used.push({
                                        index: tools_used.length + 1,
                                        id: jsonData.tool_id,
                                        name: jsonData.tool_name,
                                        input: jsonData.data.input ? (typeof jsonData.data.input === "string" ? jsonData.data.input : JSON.stringify(jsonData.data.input)) : "",
                                        output: jsonData.data.output ? (typeof jsonData.data.output === "string" ? jsonData.data.output : JSON.stringify(jsonData.data.output)) : "",
                                        status: "completed",
                                        start_timestamp: new Date().toISOString(),
                                        timestamp: new Date().toISOString()
                                    })

                                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ run_id: jsonData.run_id, version: 0, call_id: jsonData.tool_id, "o": "update", "p": `/message/content/tools/${stage}/${tool_stage}`, error: null, tool: { name: jsonData.tool_name, output: jsonData.data.output, metadata: null } })}\n\n`));
                                    continue;

                                } else if (chunkType == "chat_model_end") {
                                    continue;

                                } else if (jsonData.type === "error") {
                                    const errorData = JSON.stringify({ error: jsonData.error || "Unknown error", err_type: jsonData.error_type || "unknown" });
                                    controller.enqueue(new TextEncoder().encode(`event: error\ndata: ${errorData}\n\ndata: [DONE]\n\n`));
                                    controller.close();
                                    return;
                                }

                            } catch (e) {
                                console.error("Error parsing JSON:", e);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Stream error:", error);
                    controller.error(error);
                } finally {
                    await updateMessage(conversation_id, assistant_message_id, completeResponse, tools_used, undefined, "completed", new Date().toISOString());
                    controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));

                    completeResponse = "";
                    reader.releaseLock();
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Transfer-Encoding': 'chunked',
            },
        });
    } catch (error) {
        console.error("Error fetching from backend:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch from backend" }), { status: 500 });
    }
}