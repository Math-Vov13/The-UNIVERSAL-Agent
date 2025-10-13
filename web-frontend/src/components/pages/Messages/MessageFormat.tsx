"use client";
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from "remark-gfm";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypePrettyCode from "rehype-pretty-code";
import { Link } from 'lucide-react';
import Image from 'next/image';


export default function MessageFormat({ message, }: { message: string }) {
    async function highlightCode(code: string) {
        const file = await unified()
            .use(remarkParse)
            .use(remarkRehype)
            .use(rehypePrettyCode, {
                keepBackground: false,
            })
            .use(rehypeStringify)
            .process(code);

        return String(file);
    }

    const components = {
        // Text font
        h1: (props: { node?: unknown, children?: React.ReactNode }) => {
            const { children, ...rest } = props;
            return <h1 className="text-4xl font-bold text-purple-400 mb-4 group/heading" {...rest}>
                <span className="text-gray-500 text-3xl opacity-0 group-hover/heading:opacity-100 transition-opacity mr-2 -ml-2 select-none">#</span>
                {children}
            </h1>
        },
        h2: (props: { node?: unknown, children?: React.ReactNode }) => {
            const { children, ...rest } = props;
            return <h2 className="text-3xl font-bold text-purple-400 mb-4" {...rest}>
                <span className="text-gray-500 text-2xl opacity-0 group-hover/heading:opacity-100 transition-opacity mr-2 -ml-2 select-none">#</span>
                {children}
            </h2>
        },
        h3: (props: { node?: unknown, children?: React.ReactNode }) => {
            const { children, ...rest } = props;
            return <h3 className="text-2xl font-bold text-purple-400 mb-4" {...rest}>
                <span className="text-gray-500 text-2xl opacity-0 group-hover/heading:opacity-100 transition-opacity mr-2 -ml-2 select-none">##</span>
                {children}
            </h3>;
        },
        h4: (props: { node?: unknown, children?: React.ReactNode }) => {
            const { children, ...rest } = props;
            return <h4 className="text-lg font-bold text-purple-400 mb-4" {...rest}>{children}</h4>;
        },
        h5: (props: { node?: unknown, children?: React.ReactNode }) => {
            const { children, ...rest } = props;
            return <h5 className="text-md font-bold text-purple-400 mb-4" {...rest}>{children}</h5>;
        },
        h6: (props: { node?: unknown, children?: React.ReactNode }) => {
            const { children, ...rest } = props;
            return <h6 className="text-sm font-bold text-purple-400 mb-4" {...rest}>{children}</h6>;
        },
        // p: ({ node }: { node?: unknown }, ...props: any[]) => <p className="text-lg text-gray-700 leading-relaxed mb-3" {...props} />,
        // em(props: { node?: unknown, inline?: boolean, className?: string, children?: React.ReactNode }) {
        //     const { node, ...rest } = props
        //     return <i style={{ "color": "red" }} {...rest} />
        // }, // italic

        // Lists
        ul: (props: { node?: unknown, children?: React.ReactNode }) => {
            const { children, ...rest } = props;
            return <ul className="list-disc list-inside mb-4" {...rest}>{children}</ul>;
        },
        ol: (props: { node?: unknown, children?: React.ReactNode }) => {
            const { children, ...rest } = props;
            return <ol className="list-decimal list-inside mb-4" {...rest}>{children}</ol>;

        },
        li: (props: { node?: unknown, children?: React.ReactNode }) => {
            const { children, ...rest } = props;
            return <li className="mb-1 ml-4 marker:text-gray-400" {...rest}>{children}</li>;
        },

        // Integrations
        a(props: { node?: unknown, href?: string, children?: React.ReactNode }) {
            const { node, href, children, ...rest } = props;
            return (
                <a
                    target='_blank'
                    rel='noopener noreferrer'
                    className="inline-flex items-baseline text-gray-500 hover:text-purple-500 hover:underline"
                    href={href}
                    {...rest}
                >
                    <span className="whitespace-pre-wrap leading-tight">{children}</span>
                    <Link className="ml-2 w-4 h-4 inline-block flex-shrink-0 self-baseline" />
                </a>
            );
        },
        img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
            const { src, alt } = props;
            return (
                <Image
                    src={typeof src === "string" ? src : ""}
                    alt={alt || ""}
                    className="mx-auto max-w-full h-auto hover:scale-105 transition-transform duration-200"
                    width={500} // Default width
                    height={300} // Default height
                />
            );
        },

        // Blocks
        blockquote(props: { node?: unknown, inline?: boolean, className?: string, children?: React.ReactNode }) {
            const { node, ...rest } = props
            return <blockquote className="mb-4 border-l-4 border-purple-500 pl-4 italic highlight rounded-r-md hover:bg-purple-500/10" {...rest} />
        },
        code: (props: { node?: unknown, inline?: boolean, className?: string, children?: React.ReactNode }) => {
            const { inline, className, children, ...rest } = props;
            if (inline || className === undefined) { // Simple inline code
                return <code className="bg-gray-800 px-1 py-0.5 rounded-md" {...rest}>{children}</code>;
            }

            const code_language = /language-(\w+)/.exec(className || '')?.[1];
            //const selectedStyle = languageStyles[code_language as keyof typeof languageStyles] || languageStyles.default;
            
            const CodeBlock = () => {
                "use client";
                const [highlightedCode, setHighlightedCode] = React.useState<string>('');
                const [copied, setCopied] = React.useState(false);
                
                React.useEffect(() => {
                    highlightCode(`\`\`\`${code_language || ''}\n${String(children)}\n\`\`\``).then(setHighlightedCode);
                }, []);
                const copyToClipboard = () => {
                    navigator.clipboard.writeText(String(children));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                };

                return (
                    <div className='my-4'>
                        <div className='flex bg-gray-900 text-gray-100 text-sm font-mono rounded-t-md overflow-x-auto border-b border-gray-700'>
                            <pre className='m-1'>Code Block</pre>
                            <pre className='bg-gray-600 m-1 px-3 py-1 rounded-md hover:bg-gray-800'>{code_language}</pre>
                            <div className='flex-grow' />
                            <button title='Copy to clipboard' type='button' className={`px-2 py-1 rounded-md hover:bg-gray-600 ${!copied && ("cursor-pointer")}`} onClick={copyToClipboard} disabled={copied}>{copied ? "Copied!" : "Copy" }</button>
                        </div>
                        <div className="bg-gray-800 p-2 rounded-b-md overflow-x-auto shadow-inner shadow-t-0 shadow-black/50">
                            {highlightedCode && (
                                <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />
                            )}
                        </div>
                    </div>
                );
            };

            return <CodeBlock />;
        },

        table: (props: { node?: unknown, children?: React.ReactNode }) => {
            const { children, ...rest } = props;
            return <table className="table-auto border-collapse border border-gray-400 mb-4" {...rest}>{children}</table>;
        },
        th: (props: { node?: unknown, children?: React.ReactNode }) => {
            const { children, ...rest } = props;
            return <th className="border border-gray-400 p-2" {...rest}>{children}</th>;
        },
        td: (props: { node?: unknown, children?: React.ReactNode }) => {
            const { children, ...rest } = props;
            return <td className="border border-gray-400 p-2" {...rest}>{children}</td>;
        },
        tr: (props: { node?: unknown, children?: React.ReactNode }) => {
            const { children, ...rest } = props;
            return <tr className="hover:bg-gray-700/50" {...rest}>{children}</tr>;
        },
    };

    return (
        <ReactMarkdown urlTransform={url => `${url}?utm_source=universal_agent`} components={components} remarkPlugins={[remarkGfm]}>
            {message}
        </ReactMarkdown>
    );
}