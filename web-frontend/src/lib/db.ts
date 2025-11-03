import z from "zod"
import {
    db_schema,
    message_schema,
    file_schema,
    conversation_schema,
    message_user_content_schema,
    message_assistant_content_schema
} from "./types/db.schema"

const fakedb: z.infer<typeof db_schema> = []




export async function getAllConversations(): Promise<z.infer<typeof db_schema> | []> {
    return fakedb
}

export async function getConversation(id: string): Promise<z.infer<typeof message_schema>[] | []> {
    for (const entry of fakedb) {
        const result = conversation_schema.safeParse(entry)
        if (result.success && result.data.id === id) {
            return result.data.history
        }
    }
    return []
}

export async function updateAssistantMessage(
    conv_id: string, message_id: string, content: z.infer<typeof message_assistant_content_schema>[], status?: "pending" | "completed" | "failed", end_timestamp?: string
): Promise<boolean> {
    for (let i = 0; i < fakedb.length; i++) {
        if (fakedb[i].id !== conv_id) continue;

        const result = conversation_schema.safeParse(fakedb[i])
        if (result.success) {
            const messageIndex = result.data.history.findIndex(msg => msg.id === message_id)
            if (messageIndex !== -1) {
                const message = result.data.history[messageIndex]
                if (content) message.content = content
                if (status) message.status = status
                if (end_timestamp) message.timestamp = end_timestamp
                result.data.history[messageIndex] = message
                fakedb[i] = result.data
                return true
            }
        }
    }
    return false
}

export async function updateUserMessage(
    conv_id: string, message_id: string, content?: string, files?: z.infer<typeof file_schema>[]
): Promise<boolean> {
    for (let i = 0; i < fakedb.length; i++) {
        if (fakedb[i].id !== conv_id) continue;

        const result = conversation_schema.safeParse(fakedb[i])
        if (result.success) {
            const messageIndex = result.data.history.findIndex(msg => msg.id === message_id)
            if (messageIndex !== -1) {
                const message = result.data.history[messageIndex]
                if (content) (message.content?.[0] as unknown as z.infer<typeof message_user_content_schema>).text += content
                if (files) message.attachments = (message.attachments || []).concat(files)
                result.data.history[messageIndex] = message
                fakedb[i] = result.data
                return true
            }
        }
    }
    return false
}

export async function addMessage(conv_id: string, message: z.infer<typeof message_schema>): Promise<string> {
    const message_id = crypto.randomUUID()
    message.id = message_id
    for (let i = 0; i < fakedb.length; i++) {
        const result = conversation_schema.safeParse(fakedb[i])
        if (result.success && result.data.id === conv_id) {
            result.data.history.push(message)
            fakedb[i] = result.data
            return message_id
        }
    }
    const newEntry = {
        id: conv_id,
        version: 1,
        history: [message]
    }
    fakedb.push(newEntry)
    return message_id
}

export async function clearConversation(id: string): Promise<boolean> {
    for (let i = 0; i < fakedb.length; i++) {
        const result = conversation_schema.safeParse(fakedb[i])
        if (result.success && result.data.id === id) {
            result.data.history = []
            fakedb[i] = result.data
            return true
        }
    }
    return false
}