"use client";
import {
    CodeBlock,
    CodeBlockBody,
    CodeBlockContent,
    CodeBlockCopyButton,
    CodeBlockFilename,
    CodeBlockFiles,
    CodeBlockHeader,
    CodeBlockItem,
    CodeBlockSelect,
    CodeBlockSelectContent,
    CodeBlockSelectItem,
    CodeBlockSelectTrigger,
    CodeBlockSelectValue,
} from "@/components/kibo-ui/code-block";
import type { BundledLanguage } from "@/components/kibo-ui/code-block";

export default function CodeBlockBox({ language, code, filename }: { language: string; code: string; filename: string }) {
    return (
        <CodeBlock data={[{ language, code, filename }]} defaultValue={language}>
            <CodeBlockHeader>
                <CodeBlockFiles>
                    {(item) => (
                        <CodeBlockFilename key={item.language} value={item.language}>
                            {item.filename}
                        </CodeBlockFilename>
                    )}
                </CodeBlockFiles>
                <CodeBlockSelect>
                    <CodeBlockSelectTrigger>
                        <CodeBlockSelectValue />
                    </CodeBlockSelectTrigger>
                    <CodeBlockSelectContent>
                        {(item) => (
                            <CodeBlockSelectItem key={item.language} value={item.language}>
                                {item.language}
                            </CodeBlockSelectItem>
                        )}
                    </CodeBlockSelectContent>
                </CodeBlockSelect>
                <CodeBlockCopyButton
                    onCopy={() => console.log("Copied code to clipboard")}
                    onError={() => console.error("Failed to copy code to clipboard")}
                />
            </CodeBlockHeader>
            <CodeBlockBody>
                {(item) => (
                    <CodeBlockItem key={item.language} value={item.language}>
                        <CodeBlockContent language={item.language as BundledLanguage}>
                            {item.code}
                        </CodeBlockContent>
                    </CodeBlockItem>
                )}
            </CodeBlockBody>
        </CodeBlock>
    )
}