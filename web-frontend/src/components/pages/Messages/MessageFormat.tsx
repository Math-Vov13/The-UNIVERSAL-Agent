"use client";
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from "remark-gfm";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypePrettyCode from "rehype-pretty-code";
import { Link as IconLink } from 'lucide-react';
import Image from 'next/image';
import { ImageZoom } from "@/components/kibo-ui/image-zoom";
import { cn } from "@/lib/utils";
import {
    Glimpse,
    GlimpseContent,
    GlimpseDescription,
    GlimpseImage,
    GlimpseTitle,
    GlimpseTrigger,
} from "@/components/kibo-ui/glimpse";
import { glimpse } from "@/components/kibo-ui/glimpse/server";
import Link from 'next/link';


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
            return <h2 className="text-3xl font-bold text-purple-400 my-4 mt-10 group/heading" {...rest}>
                <span className="text-gray-500 text-3xl opacity-0 group-hover/heading:opacity-100 transition-opacity mr-2 -ml-2 select-none">#</span>
                {children}
            </h2>
        },
        h3: (props: { node?: unknown, children?: React.ReactNode }) => {
            const { children, ...rest } = props;
            return <h3 className="text-2xl font-bold text-purple-400 my-4 group/heading" {...rest}>
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
        hr: (props: { node?: unknown, children?: React.ReactNode }) => {
            const { ...rest } = props;
            return <hr className="my-6 border-gray-700" {...rest} />;
        },

        // Integrations
        a(props: { node?: unknown, href?: string, children?: React.ReactNode }) {
            const { node, href, children, ...rest } = props;
            const LinkPreview = () => {
                const [loading, setLoading] = React.useState(false);
                const [linkData, setLinkData] = React.useState<{
                    title: string | null;
                    description: string | null;
                    image: string | null;
                }>({ title: null, description: null, image: null });

                return (
                    <Glimpse closeDelay={300} openDelay={600}>
                        <GlimpseTrigger asChild>
                            <Link
                                target='_blank'
                                prefetch={false}
                                rel='noopener noreferrer'
                                className="inline-flex items-baseline text-gray-500 hover:text-purple-500 hover:underline"
                                href={href ?? ''}
                                onMouseEnter={() => {
                                    if (!loading && !linkData.title) {
                                        const fetchData = async () => {
                                            setLoading(true);
                                            const result = await glimpse(href || '');
                                            setLinkData(result);
                                            setLoading(false);
                                        };
                                        fetchData();
                                    }
                                }}
                                {...rest}
                            >
                                <span className="whitespace-pre-wrap leading-tight">{children}</span>
                                <IconLink className="ml-2 w-4 h-4 inline-block flex-shrink-0 self-baseline" />
                            </Link>
                        </GlimpseTrigger>
                        {linkData.title && (
                            <GlimpseContent className="w-80 bg-purple-900/10 border border-gray-700 rounded-md shadow-lg backdrop-blur-md overflow-hidden">
                                <Link
                                    className='cursor-pointer'
                                    prefetch={false}
                                    target='_blank'
                                    href={'/proxy/redirect?url=' + (href ?? '') + '&redirTk=' + '123456789012345678'}
                                >
                                    <GlimpseTitle className='text-lg font-semibold text-purple-500 underline'>{linkData.title}</GlimpseTitle>
                                    <GlimpseDescription className='text-gray-400'>{linkData.description}</GlimpseDescription>
                                    <GlimpseImage className='border-6 border-gray-700' src={linkData.image ?? href} />
                                </Link>
                            </GlimpseContent>
                        )}
                    </Glimpse>
                );
            };

            return <LinkPreview />;
        },
        img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
            const { src, alt } = props;
            return (
                <ImageZoom
                    backdropClassName={cn(
                        '[&_[data-rmiz-modal-overlay="visible"]]:bg-black/80'
                    )}
                >
                    <Image
                        src={typeof src === "string" ? src : ""}
                        alt={alt || ""}
                        loading="eager"
                        className="mx-auto max-w-full h-auto hover:scale-105 hover:rounded-lg hover:shadow-md border transition-transform duration-200"
                        width={500} // Default width
                        height={300} // Default height
                    />
                </ImageZoom>
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
                            <button title='Copy to clipboard' type='button' className={`px-2 py-1 rounded-md hover:bg-gray-600 ${!copied && ("cursor-pointer")}`} onClick={copyToClipboard} disabled={copied}>{copied ? "Copied!" : "Copy"}</button>
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
        <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
            {message}
        </ReactMarkdown>
    );
}