import { randomUUID } from "crypto";
import z from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];
const MAX_FILES = 3;

const entrySchema = z.object({
    message: z.string().min(1).max(1000),
    files: z.array(z.object({
        name: z.string().min(1).max(100),
        type: z.enum(ALLOWED_FILE_TYPES),
        size: z.number().min(1).max(MAX_FILE_SIZE),
        content: z.string().min(1) // base64 encoded content
    })).max(MAX_FILES).optional().nullable()
});

export async function POST(request: Request) {
    const result = entrySchema.safeParse(await request.json());
    if (!result.success) {
        return new Response(JSON.stringify({ success: false, errors: result.error.flatten() }), { status: 400 });
    }

    const { message, files } = result.data;
    // Handle the chat creation logic here
    
    return new Response(JSON.stringify({ success: true, conversation_id: randomUUID(), message, files }), { status: 200 });
}
