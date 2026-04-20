import z from "zod";
import MessageFormat from "./Messages/MessageFormat";
import { message_schema, tool_schema } from "@/lib/types/client.schema";
import {
  Globe, CodeSquare, Satellite, ImageIcon, Wrench,
  Copy, Edit3, GitBranch, RefreshCw, Flag, ThumbsUp, ThumbsDown, Bookmark, Trash2,
} from "lucide-react";
import { ExternalLink } from "lucide-react";

/* ── Tool colour theme ── */
const TOOL_CLASS: Record<string, string> = {
  web_search: "tool-web",
  code_interpreter: "tool-code",
  get_satellite_position: "tool-sat",
  image_generation: "tool-img",
};
const TOOL_ICON: Record<string, React.ReactNode> = {
  web_search: <Globe className="w-3 h-3" />,
  code_interpreter: <CodeSquare className="w-3 h-3" />,
  get_satellite_position: <Satellite className="w-3 h-3" />,
  image_generation: <ImageIcon className="w-3 h-3" />,
};

function toolLabel(tool: z.infer<typeof tool_schema>): string {
  if (tool.name === "web_search") {
    try {
      const q = JSON.parse(tool.input).query ?? "";
      const short = q.length > 40 ? q.slice(0, 37) + "…" : q;
      return short ? `"${short}"` : "web search";
    } catch { return "web search"; }
  }
  return tool.name.replace(/_/g, " ");
}

function toolStatus(tool: z.infer<typeof tool_schema>): string {
  if (tool.status === "in_progress") return "running…";
  if (tool.status === "failed") return "failed";
  return "done";
}

function getSearchResultsCount(output: unknown): number {
  if (!output) return 0;
  const resolve = (v: unknown): unknown => {
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") return (v as { results?: unknown }).results ?? [];
    return [];
  };
  if (typeof output === "string") {
    try { const r = resolve(JSON.parse(output)); return Array.isArray(r) ? r.length : 0; }
    catch { return 0; }
  }
  const r = resolve(output);
  return Array.isArray(r) ? r.length : 0;
}

export default function ChatMessage({
  message, index, isLast,
}: {
  message: z.infer<typeof message_schema>;
  index: string;
  isLast: boolean;
}) {
  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString("fr-FR", { month: "short", day: "numeric" })}, ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const tools_used = message.content.filter(
    (p) => p && "status" in p && "name" in p
  ) as unknown as z.infer<typeof tool_schema>[];

  const textPartCount = message.content.filter(
    (p) => !!p && "type" in p && p.type === "text"
  ).length;

  const shouldShowNoContentFallback =
    message.status === "completed" && textPartCount === 0;

  /* ── USER message ──────────────────────────────────────────── */
  if (message.role === "user") {
    return (
      <div key={index} className="flex flex-col items-end group animate-slideInRight">
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-1.5 flex items-center gap-1 text-xs text-gray-600 font-mono">
            <span>{message.attachments.length} attachment{message.attachments.length > 1 ? "s" : ""}</span>
          </div>
        )}
        <div className="max-w-[72%] px-4 py-3 rounded-2xl rounded-tr-sm bg-[#3A29FF]/70 text-sm text-white leading-relaxed shadow-lg shadow-[#3A29FF]/10">
          {message.content[0] && "type" in message.content[0] && message.content[0].type === "text" && (
            <MessageFormat message={message.content[0].text} />
          )}
        </div>
        {/* hover actions */}
        <div className="flex items-center gap-2 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="font-mono text-[10px] text-gray-700">{formatTime(message.timestamp)}</span>
          <button type="button" title="Edit" className="p-0.5 text-gray-700 hover:text-gray-400 transition-colors cursor-pointer">
            <Edit3 className="w-3 h-3" />
          </button>
          <button type="button" title="Copy" className="p-0.5 text-gray-700 hover:text-gray-400 transition-colors cursor-pointer">
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  /* ── ASSISTANT message ─────────────────────────────────────── */
  return (
    <div key={index} className="flex gap-3 group animate-slideInLeft">

      {/* Avatar */}
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#3A29FF] to-[#FF94B4] flex-shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        {/* Model label */}
        <span className="block text-[10px] font-mono text-gray-700 mb-2 tracking-wide">
          Gemini 2.5 Flash
        </span>

        {/* Tool pills */}
        {tools_used.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tools_used.map((tool, idx) => (
              <span
                key={idx}
                className={`tool-pill ${TOOL_CLASS[tool.name] ?? "tool-def"} ${tool.status === "failed" ? "opacity-60" : ""}`}
              >
                <span className={`tool-dot ${tool.status === "in_progress" ? "animate-pulse" : ""}`} />
                {TOOL_ICON[tool.name] ?? <Wrench className="w-3 h-3" />}
                <span>{toolLabel(tool)}</span>
                <span className="opacity-40">·</span>
                <span className="opacity-60">
                  {tool.name === "web_search" && tool.status === "completed"
                    ? `${getSearchResultsCount(tool.output)} results`
                    : toolStatus(tool)}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Message content */}
        <div className="text-sm text-gray-200 leading-relaxed space-y-2">
          {message.content.map((part, idx) => {
            if (part && "type" in part && part.type === "text") {
              const raw = part.text ?? "";
              if (!raw.trim()) {
                return message.status === "completed"
                  ? <p key={idx} className="text-gray-600 italic text-xs">No content returned.</p>
                  : null;
              }
              return (
                <div key={idx}>
                  <MessageFormat message={raw} />
                </div>
              );
            }

            if (part && "status" in part && "name" in part) {
              const p = part as z.infer<typeof tool_schema>;
              return (
                <span
                  key={idx}
                  className={`tool-pill ${TOOL_CLASS[p.name] ?? "tool-def"} text-[10px] opacity-70`}
                >
                  {p.name === "web_search" ? "Web search" : `Tool: ${p.name.replace(/_/g, " ")}`}
                  <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                </span>
              );
            }

            return null;
          })}

          {shouldShowNoContentFallback && (
            <p className="text-gray-600 italic text-xs">No content returned.</p>
          )}
        </div>

        {/* Hover action bar */}
        {message.status === "completed" && (
          <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="font-mono text-[10px] text-gray-700 mr-2">{formatTime(message.timestamp)}</span>
            <button type="button" title="Branch" className="p-1 text-gray-700 hover:text-gray-400 rounded transition-colors cursor-pointer"><GitBranch className="w-3.5 h-3.5" /></button>
            <button type="button" title="Copy" className="p-1 text-gray-700 hover:text-gray-400 rounded transition-colors cursor-pointer"><Copy className="w-3.5 h-3.5" /></button>
            <button type="button" title="Regenerate" className="p-1 text-gray-700 hover:text-gray-400 rounded transition-colors cursor-pointer"><RefreshCw className="w-3.5 h-3.5" /></button>
            <button type="button" title="Report" className="p-1 text-gray-700 hover:text-gray-400 rounded transition-colors cursor-pointer"><Flag className="w-3.5 h-3.5" /></button>
            {isLast && (
              <>
                <div className="w-px h-4 bg-white/[0.07] mx-1" />
                <button type="button" title="Thumbs up" className="p-1 text-gray-700 hover:text-[#3A29FF] rounded transition-colors cursor-pointer"><ThumbsUp className="w-3.5 h-3.5" /></button>
                <button type="button" title="Thumbs down" className="p-1 text-gray-700 hover:text-[#3A29FF] rounded transition-colors cursor-pointer"><ThumbsDown className="w-3.5 h-3.5" /></button>
              </>
            )}
            <div className="w-px h-4 bg-white/[0.07] mx-1" />
            <button type="button" title="Bookmark" className="p-1 text-gray-700 hover:text-[#ffaa40] rounded transition-colors cursor-pointer"><Bookmark className="w-3.5 h-3.5" /></button>
            <button type="button" title="Delete" className="p-1 text-gray-700 hover:text-red-400 rounded transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
