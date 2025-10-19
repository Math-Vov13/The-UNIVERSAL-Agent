import { NextRequest } from "next/server";
import z from "zod";

const querySchema = z.object({
    url: z.url(),
    token: z.string().min(18),
    captureTags: z.enum(["title", "description", "image", "all"]).optional()
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

    try {
        const r = await fetch(result.data.url, {
            headers: {
                'cache-control': 'max-age=3600',
                'Content-Type': 'text/html',
                'X-Forwarded-Server': req.nextUrl.host,
                'X-Forwarded-Host': req.nextUrl.host,
                'X-Forwarded-Proto': req.nextUrl.protocol.replace(':', ''),
                'X-Forwarded-Port': req.nextUrl.port || '',

                'X-Forwarded-For': req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
                'X-Real-Ip': req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '',
            }
        });
        if (!r.ok) {
            return new Response(`Proxy: failed to fetch URL`, { status: 404, headers: {"Content-Type": "text/plain"} });
        }

        const data = await r.text();
        return new Response(data, { status: 200, headers: { 'Content-Type': 'text/html', 'X-Redirected-By': req.nextUrl.host } });

    } catch (error) {
        console.error("Error fetching URL in proxy:", error);
        return new Response("Proxy: failed to fetch URL", { status: 404, headers: {"Content-Type": "text/plain"} });
    }
}