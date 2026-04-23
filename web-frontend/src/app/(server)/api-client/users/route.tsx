import { usersTable } from "@/db/schema/users.sql";
import { db } from "@/db/index";

export const dynamic = 'force-dynamic';

export async function GET() {
    const users = await db.select().from(usersTable);

    console.log("Fetched users:", users);
    return new Response(JSON.stringify(users), { status: 200, headers: { "Content-Type": "application/json" } });
}