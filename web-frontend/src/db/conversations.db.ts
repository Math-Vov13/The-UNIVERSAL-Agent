import z from "zod";
import { db } from "@/db/index";
import { conversation_schema, file_schema, message_assistant_content_schema, message_user_content_schema } from "@/lib/types/db.schema";
import { sql } from "drizzle-orm";


type MessageSQLResponse = {
    success: boolean,
    code: number,
    message: string,
    data: {
        message_id?: string,
        file_id?: string,
    }
}


export async function getConversation(conv_id: string, user_id: string): Promise<z.infer<typeof conversation_schema> | null> {
    try {
        const result = await db.execute(sql`SELECT get_conversation_history(${conv_id}, ${Number(user_id)});`);
        if (result.length === 0) {
            return null;
        }
        // const parsed = message_schema.array().safeParse(result[0].get_conversation_history);

        // if (!parsed.success) {
        //     return [];
        // }

        // return parsed.data;
        return result[0].get_conversation_history as z.infer<typeof conversation_schema>;

    } catch (error) {
        console.error('Error fetching conversation:', error);
        return null;
    }
}

export async function save_user_message(conversation_id: string, user_id: string, message: z.infer<typeof message_user_content_schema>[]): Promise<string | null> {
    try {
        const result = await db.execute(sql`SELECT add_user_message(${conversation_id}, ${Number(user_id)}, ${JSON.stringify(message)}::json);`);
        console.log('Result of add_user_message:', result);

        const message_id = (result[0]?.add_user_message as MessageSQLResponse)?.data?.message_id;
        return message_id || null;
    } catch (error) {
        console.error('Error saving user message:', error);
        return null;
    }
}

export async function save_agent_message(conversation_id: string, user_id: string, message: z.infer<typeof message_assistant_content_schema>[]): Promise<string | null> {
    try {
        const result = await db.execute(sql`SELECT add_agent_message(${conversation_id}, ${Number(user_id)}, ${JSON.stringify(message)}::json);`);
        console.log('Result of add_agent_message:', result);
        
        const message_id = (result[0]?.add_agent_message as MessageSQLResponse)?.data?.message_id;
        return message_id || null;
    } catch (error) {
        console.error('Error saving agent message:', error);
        return null;
    }
}

export async function save_message_files(conversation_id: string, user_id: string, message_id: string, files: z.infer<typeof file_schema>[]): Promise<string[]> {
    try {
        console.log('Saving message files:', files);
        const files_uuids: string[] = [];
        for (const file of files) {
            const file_metadata = {
                name: file.name,
                size: file.size,
                mimeType: file.mimeType,
                type: file.type,
            }
            
            const result = await db.execute(sql`SELECT attach_file_message(${conversation_id}, ${Number(user_id)}, ${message_id}, ${file.uri}, ${JSON.stringify(file_metadata)}::json);`);
            const file_id = (result[0]?.attach_file_message as MessageSQLResponse)?.data?.file_id;
            if (file_id) {
                files_uuids.push(file_id);
            }
        }
        return files_uuids;
    } catch (error) {
        console.error('Error saving message files:', error);
        return [];
    }
}