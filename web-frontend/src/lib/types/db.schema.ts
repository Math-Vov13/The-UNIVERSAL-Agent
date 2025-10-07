import z from "zod";

export const file_schema = z.object({
    index: z.number().min(0),
    name: z.string(),
    size: z.number().max(5 * 1024 * 1024), // Max 5MB
    mimeType: z.string(),
    type: z.string(),
    uri: z.string()
});

export const tool_schema = z.object({
    index: z.number().min(0).default(0),
    id: z.string().min(1),
    name: z.string(),
    input: z.string(),
    output: z.string(),
    status: z.enum(["in_progress", "completed", "failed"]),
    start_timestamp: z.string(),
    timestamp: z.string()
});

export const message_schema = z.object({
    version: z.number().min(1).max(5).default(1),
    id: z.uuidv4(),
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    tools: z.array(tool_schema).optional(),
    files: z.array(file_schema).max(5).optional(),
    status: z.enum(["pending", "completed", "failed"]).optional(),
    timestamp: z.string()
})

export const db_schema = z.object({
  id: z.uuidv4(),
  history: z.array(message_schema),
})