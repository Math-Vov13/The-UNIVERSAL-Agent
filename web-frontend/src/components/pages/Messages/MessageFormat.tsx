"use client";
import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
// import type { PluggableList, Plugin } from 'unified';

import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
const Streamdown = dynamic(() => import('streamdown').then(m => m.Streamdown), {
    ssr: false,
    loading: () => null,
});

import { cn } from "@/lib/utils";
import remarkExtractFilename from './CustomRemark/extract_file_metadata';
const ImageZoom = dynamic(() => import("@/components/kibo-ui/image-zoom").then(m => m.ImageZoom), { ssr: false });
const LinkPreview = dynamic(() => import('./Renders/LinkPreview'), { ssr: false });
const CodeBlockBox = dynamic(() => import('./Renders/CodeBlock'), { ssr: false });
const MermaidBlock = dynamic(() => import('./Renders/MermaidBlock'), { ssr: false });



export default function MessageFormat({ message, }: { message: string }) {
    // async function highlightCode(code: string) {
    //     const file = await unified()
    //         .use(remarkParse)
    //         .use(remarkRehype)
    //         .use(rehypePrettyCode, {
    //             keepBackground: false,
    //         })
    //         .use(rehypeStringify)
    //         .process(code);

    //     return String(file);
    // }

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
            return <LinkPreview href={href || ''} {...rest}>{children}</LinkPreview>;
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
        code: (props: { node?: unknown, inline?: boolean, className?: string, children?: React.ReactNode, 'data-filename'?: string }) => {
            const { inline, className, children, 'data-filename': filename, ...rest } = props;
            if (inline || className === undefined) { // Simple inline code
                return <code className="bg-gray-800 px-1 py-0.5 rounded-md" {...rest}>{children}</code>;
            }

            const code_language = /language-(\w+)/.exec(className || '')?.[1];
            if (code_language === 'mermaid') {
                return (
                    <MermaidBlock chart={String(children)} filename={filename || ""} />
                );
            }

            return (
                <CodeBlockBox language={code_language || "plaintext"} code={String(children)} filename={filename || "CodeBlock"} />
            )
        },

        // Tables
        // table: (props: { node?: unknown, children?: React.ReactNode }) => {
        //     const { children, ...rest } = props;
        //     return (

        //     )
        // },
        // table: (props: { node?: unknown, children?: React.ReactNode }) => {
        //     const { children, ...rest } = props;
        //     return <table className="table-auto border-collapse border border-gray-400 mb-4" {...rest}>{children}</table>;
        // },
        // th: (props: { node?: unknown, children?: React.ReactNode }) => {
        //     const { children, ...rest } = props;
        //     return <th className="border border-gray-400 p-2" {...rest}>{children}</th>;
        // },
        // td: (props: { node?: unknown, children?: React.ReactNode }) => {
        //     const { children, ...rest } = props;
        //     return <td className="border border-gray-400 p-2" {...rest}>{children}</td>;
        // },
        // tr: (props: { node?: unknown, children?: React.ReactNode }) => {
        //     const { children, ...rest } = props;
        //     return <tr className="hover:bg-gray-700/50" {...rest}>{children}</tr>;
        // },
    };

    return (
        // <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        //     {message}
        // </ReactMarkdown>
        <Suspense fallback={message}>
            <Streamdown isAnimating={false} components={components} remarkPlugins={[remarkGfm, remarkMath, remarkExtractFilename]}>
                {message}
            </Streamdown>
        </Suspense>
    );
}