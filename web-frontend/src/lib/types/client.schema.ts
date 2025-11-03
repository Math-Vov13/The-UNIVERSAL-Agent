import z from "zod";

export const file_schema = z.object({
    type: z.enum(["image", "text", "pdf", "word", "excel", "powerpoint", "code", "other"]),
    data: z.file().optional(), // Local file data, not stored in DB

    name: z.string().optional(), // Sync with history
    size: z.number().max(5 * 1024 * 1024).optional(), // sync with history, Max 5MB
    mimeType: z.string().optional(), // Sync with history
    lastModified: z.number().optional(), // Sync with history
    uri: z.string().optional() // Sync with history
});

export const tool_schema = z.object({
    index: z.number().min(0).default(0),
    call_id: z.string().min(1),
    name: z.string(),
    input: z.string(),
    output: z.string(),
    status: z.enum(["in_progress", "completed", "failed"]),
    start_timestamp: z.string(),
    timestamp: z.string()
});

export const message_user_content_schema = z.object({
    type: z.literal("text"),
    text: z.string(),
});

export const message_assistant_content_schema = z.union([
    z.object({
        type: z.literal("text"),
        text: z.string(),
    }),
    tool_schema.optional()
]);

export const message_schema = z.object({
    id: z.uuidv4(),
    role: z.enum(["user", "assistant"]),
    content: z.array(z.union([message_user_content_schema, message_assistant_content_schema])),
    attachments: z.array(file_schema).max(5).optional(), // User_message
    status: z.enum(["pending", "completed", "failed"]).optional(), // Assistant_message
    metadata: z.record(z.string(), z.any()).optional(), // added field
    timestamp: z.string()
});
