import z from "zod"

const fakedb: z.infer<typeof db_schema>[] = []


export const message_schema = z.object({
    id: z.number(),
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    timestamp: z.string()
})

export const db_schema = z.object({
  id: z.string().min(1),
  history: z.array(message_schema),
})




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

export async function saveMessage(id: string, message: z.infer<typeof message_schema>): Promise<boolean> {
    for (let i = 0; i < fakedb.length; i++) {
        const result = db_schema.safeParse(fakedb[i])
        if (result.success && result.data.id === id) {
            result.data.history.push(message)
            fakedb[i] = result.data
            return true
        }
    }
    const newEntry = {
        id: id,
        history: [message]
    }
    fakedb.push(newEntry)
    return true
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