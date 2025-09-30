import { getConversation, saveMessage } from "@/lib/db";
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

        await saveMessage(conversation_id, {
            id: 0,
            role: "user",
            content: prompt,
            timestamp: new Date().toISOString()
        });

        let completeResponse = "";

        // Set up streaming response with proper SSE format
        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body?.getReader();
                if (!reader) {
                    controller.close();
                    return;
                }

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
                                if (jsonData.content) {
                                    // Format as SSE with proper structure
                                    const sseData = JSON.stringify({
                                        content: jsonData.content,
                                        token: jsonData.usage_metadata?.output_tokens || 0
                                    });
                                    completeResponse += jsonData.content;
                                    controller.enqueue(new TextEncoder().encode(`data: ${sseData}\n\n`));
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
                    await saveMessage(conversation_id, {
                        id: 0,
                        role: "assistant",
                        content: completeResponse,
                        timestamp: new Date().toISOString()
                    });
                    
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