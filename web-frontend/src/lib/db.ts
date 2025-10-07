import z from "zod"
import { db_schema, message_schema, tool_schema, file_schema } from "./types/db.schema"

const fakedb: z.infer<typeof db_schema>[] = []




export async function getAllConversations(): Promise<z.infer<typeof db_schema>[] | []> {
    return fakedb
}

export async function getConversation(id: string): Promise<z.infer<typeof message_schema>[] | []> {
    for (const entry of fakedb) {
        const result = db_schema.safeParse(entry)
        if (result.success && result.data.id === id) {
            return result.data.history
        }
    }
    return []
}

export async function updateMessage(
    conv_id: string, message_id: string, content?: string, tools?: z.infer<typeof tool_schema>[], files?: z.infer<typeof file_schema>[], status?: "pending" | "completed" | "failed", end_timestamp?: string
): Promise<boolean> {
    for (let i = 0; i < fakedb.length; i++) {
        if (fakedb[i].id !== conv_id) continue;

        const result = db_schema.safeParse(fakedb[i])
        if (result.success) {
            const messageIndex = result.data.history.findIndex(msg => msg.id === message_id)
            if (messageIndex !== -1) {
                const message = result.data.history[messageIndex]
                if (content) message.content += content
                if (tools) message.tools = (message.tools || []).concat(tools)
                if (files) message.files = (message.files || []).concat(files)
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

export async function saveMessage(conv_id: string, message: z.infer<typeof message_schema>): Promise<string> {
    const message_id = crypto.randomUUID()
    message.id = message_id
    for (let i = 0; i < fakedb.length; i++) {
        const result = db_schema.safeParse(fakedb[i])
        if (result.success && result.data.id === conv_id) {
            result.data.history.push(message)
            fakedb[i] = result.data
            return message_id
        }
    }
    const newEntry = {
        id: conv_id,
        history: [message]
    }
    fakedb.push(newEntry)
    return message_id
}

export async function clearConversation(id: string): Promise<boolean> {
    for (let i = 0; i < fakedb.length; i++) {
        const result = db_schema.safeParse(fakedb[i])
        if (result.success && result.data.id === id) {
            result.data.history = []
            fakedb[i] = result.data
            return true
        }
    }
    return false
}