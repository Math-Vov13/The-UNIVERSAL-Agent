import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const querySchema = z.object({
    url: z.url(),
    redirTk: z.string().min(18),
});

export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;

    const result = querySchema.safeParse({
        ...Object.fromEntries(params)
    });
    if (!result.success) {
        console.warn("Invalid URL in proxy redirect:", result.error);
        return new Response("Invalid URL", { status: 400 });
    }
    if (!result.data.url.startsWith("https://")) {
        return new Response("Only HTTPS URLs are allowed", { status: 400 });
    }
    if (result.data.url.length > 2048) {
        return new Response("URL too long", { status: 414 });
    }

    return NextResponse.redirect(result.data.url);
}