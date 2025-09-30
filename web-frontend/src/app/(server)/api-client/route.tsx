
export async function GET() {
  return new Response(JSON.stringify({
    base_url: `${process.env.BACKEND_BASE_URL}`,
    status: "healthy",
  }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
