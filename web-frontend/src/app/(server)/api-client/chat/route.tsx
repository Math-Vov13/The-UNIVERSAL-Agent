import z from "zod";

const history_schema = z.object({
    id: z.number(),
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    timestamp: z.string()
})

const entry_schema = z.object({
    prompt: z.string().min(1).max(2000),
    history: z.array(history_schema),
    conversation_id: z.uuidv4(),
})

export async function POST(req: Request) {

    const request = entry_schema.safeParse(await req.json());
    if (!request.success) {
        return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });
    }

    const { prompt } = request.data;
    console.log("url:", `${process.env.BACKEND_BASE_URL}/generation`);

    try {
        const response = await fetch(`${process.env.BACKEND_BASE_URL}/generation`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt }),
        });
        if (!response.ok) {
            throw new Error("Failed to fetch");
        }
        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch {
        return new Response(JSON.stringify({ error: "Failed to fetch from backend" }), { status: 500 });
    }
}