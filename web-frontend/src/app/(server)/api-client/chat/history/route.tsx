import { getConversation } from "@/lib/db";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversation_id");

    if (!conversationId) {
        return new Response("Missing conversation_id", { status: 400 });
    }

    try {
        const history = await getConversation(conversationId);
        if (!history || history.length === 0) {
            return new Response("Not authorized", { status: 403 });
        }

        return new Response(JSON.stringify(history), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (error) {
        console.error("Error fetching conversation history:", error);
        return new Response("Error fetching conversation history", { status: 403 });
    }
}
