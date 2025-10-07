import z from "zod";

export const file_schema = z.object({
    type: z.enum(["image", "text", "pdf", "word", "excel", "powerpoint", "code", "other"]),
    data: z.file().optional(),

    name: z.string().optional(), // Sync with history
    size: z.number().max(5 * 1024 * 1024).optional(), // sync with history, Max 5MB
    mimeType: z.string().optional(), // Sync with history
    lastModified: z.number().optional(), // Sync with history
    uri: z.string().optional() // Sync with history
});

export const tool_schema = z.object({
    id: z.string().min(1),
    name: z.string(),
    input: z.string(),
    output: z.string().optional(),
    status: z.enum(["in_progress", "completed", "failed"])
});

export const message_schema = z.object({
    id: z.uuidv4(),
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    tools: z.array(tool_schema).optional(),
    files: z.array(file_schema).max(5).optional(),
    status: z.enum(["pending", "completed", "failed"]).optional(),
    timestamp: z.string()
})