import { getConversation } from "@/db/conversations.db";
import { conversation_schema } from "@/lib/types/db.schema";

export const dynamic = 'force-dynamic';


export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversation_id");

    if (!conversationId) {
        return new Response("Missing conversation_id", { status: 400 });
    }

    // Fetch conversation history from the database
    const history = await getConversation(conversationId, "1");
    if (!history) {
        return new Response("Not authorized", { status: 403 });
    }

    // Parse and validate the conversation history
    const history_parsed = await conversation_schema.safeParseAsync(history);
    if (!history_parsed.success) {
        console.error("Conversation history parsing failed:", history_parsed.error);
        return new Response("Error parsing conversation history", { status: 500 });
    }

    // Check if the conversation history is empty
    console.log("Conversation history retrieved:", history_parsed.data.history);
    if (history_parsed.data.history.length === 0) {
        return new Response("No conversation history found", { status: 404 }); // More likely due to a bug server-side (history not saved correctly!)
    }

    return new Response(JSON.stringify(history_parsed.data.history), { status: 200, headers: { "Content-Type": "application/json" } });
}
