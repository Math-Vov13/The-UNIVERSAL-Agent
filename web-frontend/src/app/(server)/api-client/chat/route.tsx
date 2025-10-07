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
                let tools_used: z.infer<typeof tool_schema>[] = [];

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            // Send final DONE message
                            controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
                            controller.close();
                            break;
                        }

                        const text = new TextDecoder().decode(value);
                        const lines = text.split('\n').filter(line => line.trim().startsWith('data:'));

                        for (const line of lines) {
                            try {
                                const jsonStr = line.substring(5).trim();
                                if (jsonStr === "[DONE]") break;

                                const jsonData = JSON.parse(jsonStr);
                                if (jsonData.status === "chat_model_stream") {
                                    if (jsonData.chunk) {
                                        // Format as SSE with proper structure
                                        const sseData = JSON.stringify({
                                            content: jsonData.chunk,
                                            token: jsonData.tokens || 0
                                        });
                                        completeResponse += jsonData.chunk;
                                        controller.enqueue(new TextEncoder().encode(`event: delta\n\ndata: ${sseData}\n\n`));
                                    }

                                } else if (jsonData.status === "file_uploaded" || jsonData.status === "tool_start" || jsonData.status === "tool_end") {
                                    if (jsonData.status === "file_uploaded") {
                                        await updateMessage(conversation_id, user_message_id, undefined, undefined, [{
                                            index: 0,
                                            name: jsonData.name,
                                            size: jsonData.size,
                                            mimeType: jsonData.mimeType,
                                            type: jsonData.type,
                                            uri: jsonData.key
                                        }]);
                                    } else if (jsonData.status === "tool_start") {
                                        tools_used.push({
                                            index: tools_used.length,
                                            id: jsonData.id,
                                            name: jsonData.name,
                                            input: typeof jsonData.input === "string" ? jsonData.input : JSON.stringify(jsonData.input),
                                            output: "",
                                            status: "in_progress",
                                            start_timestamp: new Date().toISOString(),
                                            timestamp: new Date().toISOString()
                                        });
                                    } else if (jsonData.status === "tool_end") {
                                        if (tools_used.find(t => t.id === jsonData.id)) {
                                            tools_used = tools_used.map(t => {
                                                if (t.id === jsonData.id) {
                                                    t.status = "completed";
                                                    t.output = typeof jsonData.output === "string" ? jsonData.output : JSON.stringify(jsonData.output);
                                                    t.timestamp = new Date().toISOString();
                                                }
                                                return t;
                                            });
                                        }
                                    }
                                    const sseData = JSON.stringify(jsonData);
                                    controller.enqueue(new TextEncoder().encode(`event: delta\ndata: ${sseData}\n\n`));

                                } else if (jsonData.status === "error") {
                                    const errorData = JSON.stringify({ error: jsonData.detail || "Unknown error" });
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