import MessageFormat from "@/components/pages/Messages/MessageFormat";
import { Suspense } from "react";

export default async function PageTest() {
    //const Content = "# Hello, world!\n\nThis is a **Markdown** _test_.\n\n- Item 1\n- Item 2\n- Item 3\n\n```javascript\nconsole.log('Hello, world!');\n```";
    const req = await fetch("http://localhost:3000/TEST.md", { cache: "no-store" });
    const data = await req.text();

    return (
        <div className="p-10 flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <Suspense fallback={<div>Loading...</div>}>
                <MessageFormat message={data}/>
            </Suspense>
        </div>
    )
}