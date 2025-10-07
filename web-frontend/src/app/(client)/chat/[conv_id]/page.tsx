"use client";
import ChatBarProps from "@/components/pages/ChatBar";
import ChatWindow from "@/components/pages/ChatWindow";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { message_schema } from "@/lib/types/client.schema";
import { PlusSquare } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import z from "zod";


type FilePayload = {
  name: string;
  size: number;
  type: string;
  base64: string;
};

export default function ChatPage() {
  const authorized = true; // Replace with actual authorization logic
  const params = useSearchParams();
  const { conv_id } = useParams();
  const conversationId = Array.isArray(conv_id) ? (conv_id[0] ?? "") : (conv_id ?? "");
  const firstMessage = (params.get('first') || '').trim();
  const [messages, setMessages] = useState<z.infer<typeof message_schema>[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messageIdRef = useRef("0");
  const messagesRef = useRef<z.infer<typeof message_schema>[]>([]);
  const lastBootstrapKeyRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);


  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadConversationHistory = async () => {
      if (!conversationId || firstMessage) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        setIsLoadingHistory(true);
        const response = await fetch(`/api-client/chat/history?conversation_id=${conversationId}`);
        if (!response.ok) {
          setIsLoadingHistory(false);
          return;
        }

        const actualHistory = await response.json() as z.infer<typeof message_schema>[];
        console.log("Fetched history:", actualHistory);

        if (actualHistory && actualHistory.length > 0) {
          const formattedHistory = actualHistory.map((msg, index) => ({
            ...msg,
            id: String(index + 1),
            timestamp: msg.timestamp
          }));

          setMessages(formattedHistory);
          messagesRef.current = formattedHistory;
          messageIdRef.current = String(formattedHistory.length);
        }
      } catch (error) {
        console.error("Error loading conversation history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadConversationHistory();
  }, [conversationId, firstMessage]);


  const sendMessageToAgent = useCallback(
    async (prompt: string, files: FilePayload[] | null) => {
      if (!prompt || !isMountedRef.current) {
        return;
      }

      setIsThinking(true);

      // Créer le message assistant vide pour le streaming
      messageIdRef.current += 1;
      const assistantMessage: z.infer<typeof message_schema> = {
        id: messageIdRef.current,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };

      // Ajouter le message vide à l'état
      setMessages((previous) => {
        const next = [...previous, assistantMessage];
        messagesRef.current = next;
        return next;
      });

      console.log("Sending prompt to agent:", prompt, files);

      try {
        const response = await fetch("/api-client/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify({
            prompt,
            envPresets: 'default',
            modelChoice: "auto",
            modelName: "gemini-2.5-flash",
            conversation_id: conversationId,
            extra: [],
            files: files ? Array.from(files) : [],
            metadata: {
              client: "web",
              clientBuild: "az14BdksjPOA46.2",
            }
          }),
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No reader available");
        }

        let accumulatedContent = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          let actualEvent = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              actualEvent = line.slice(7).trim();

            } else if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                return;
              }

              try {
                const parsed = JSON.parse(data);

                if (actualEvent !== '') {
                  console.log(`Event ${actualEvent}:`, parsed);
                  
                }
                const content = parsed.content || parsed.delta?.content || '';
                const tool_input = parsed.input || '';
                const tool_output = parsed.output || '';
                const tool_name = parsed.name || '';
                const tool_id = parsed.id || '';

                if (content) {
                  accumulatedContent += content;

                  // Mettre à jour le message en temps réel
                  if (isMountedRef.current) {
                    setMessages((previous) => {
                      const updated = [...previous];
                      const lastIndex = updated.length - 1;
                      if (lastIndex >= 0 && updated[lastIndex].id === assistantMessage.id) {
                        updated[lastIndex] = {
                          ...updated[lastIndex],
                          content: accumulatedContent,
                        };
                      }
                      messagesRef.current = updated;
                      return updated;
                    });
                  }
                } else if (tool_name && tool_id) {
                  // Handle tool usage updates
                  if (isMountedRef.current) {
                    setMessages((previous) => {
                      const updated = [...previous];
                      const lastIndex = updated.length - 1;
                      if (lastIndex >= 0 && updated[lastIndex].id === assistantMessage.id) {
                        const existingTools = updated[lastIndex].tools || [];
                        const toolIndex = existingTools.findIndex(t => t.id === tool_id);
                        if (toolIndex !== -1) {
                          // Update existing tool entry
                          existingTools[toolIndex] = {
                            ...existingTools[toolIndex],
                            input: tool_input || existingTools[toolIndex].input,
                            output: tool_output || existingTools[toolIndex].output,
                            status: tool_output ? 'completed' : 'in_progress',
                          };
                        } else {
                          // Add new tool entry
                          existingTools.push({
                            id: tool_id,
                            name: tool_name,
                            input: tool_input,
                            output: tool_output,
                            status: tool_output ? 'completed' : 'in_progress',
                          });
                        }
                        updated[lastIndex] = {
                          ...updated[lastIndex],
                          tools: existingTools,
                        };
                      }
                      messagesRef.current = updated;
                      return updated;
                    });
                  }
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
              actualEvent = '';
            }
          }
        }

      } catch (error) {
        console.error("Error generating response:", error);

        // Remplacer le message vide par un message d'erreur
        if (isMountedRef.current) {
          setMessages((previous) => {
            const updated = [...previous];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].id === assistantMessage.id) {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: "Sorry, an error occurred. Please try again.",
              };
            }
            messagesRef.current = updated;
            return updated;
          });
        }
      } finally {
        if (isMountedRef.current) {
          setIsThinking(false);
        }
      }
    },
    [conversationId]
  );

  useEffect(() => {
    const bootstrapKey = `${conversationId}|${firstMessage}`;

    if (!firstMessage) {
      messageIdRef.current = "0";
      messagesRef.current = [];
      lastBootstrapKeyRef.current = bootstrapKey;
      setIsThinking(false);
      setMessages([]);
      return;
    }

    if (lastBootstrapKeyRef.current === bootstrapKey) {
      return;
    }

    lastBootstrapKeyRef.current = bootstrapKey;

    messageIdRef.current = "1";
    const initialMessage: z.infer<typeof message_schema> = {
      id: "-1",
      role: "user",
      content: firstMessage,
      timestamp: new Date().toISOString(),
    };
    // window.history.replaceState({}, '', `${window.location.pathname}`);

    const initialMessages = [initialMessage];
    messagesRef.current = initialMessages;
    setMessages(initialMessages);

    void sendMessageToAgent(firstMessage, null);
  }, [conversationId, firstMessage, sendMessageToAgent]);

  const handleSubmit = useCallback(
    async (message: string, files: FileList | null) => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage) {
        return;
      }

      messageIdRef.current += 1;
      const userMessage: z.infer<typeof message_schema> = {
        id: messageIdRef.current,
        role: "user",
        content: trimmedMessage,
        files: files ? Array.from(files).map(file => {
          return {
            type: "image",
            data: file
          };
        }) : [],
        timestamp: new Date().toISOString(),
      };

      const filesArray = [];
      for (let i = 0; files && i < files.length; i++) {
        filesArray.push({
          name: files[i].name,
          size: files[i].size,
          mimeType: files[i].type,
          type: "image",
          base64: await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === "string") {
                resolve(reader.result);
              } else {
                reject(new Error("Failed to read file"));
              }
            };
            reader.onerror = () => {
              reject(new Error("Failed to read file"));
            };
            reader.readAsDataURL(files[i]);
          }),
        });
      }

      const nextMessages = [...messagesRef.current, userMessage];
      messagesRef.current = nextMessages;
      setMessages(nextMessages);

      await sendMessageToAgent(trimmedMessage, filesArray.length > 0 ? filesArray : null);
    },
    [sendMessageToAgent]
  );


  if (!authorized) {
    return (
      <main className="flex flex-col h-screen">
        <div className="flex flex-1 flex-col overflow-hidden">
          <p className="text-gray-500 mx-auto my-auto h-full p-6">403 - This conversation is private or not does not exist.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-screen">
      <nav className="h-16 bg-gray-800 flex items-center px-4">
        <button className="text-purple-400 p-[3px] relative mr-4">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" />
          <div className="bg-black rounded-[6px]  relative group transition duration-200 text-white hover:bg-transparent">
            <Link className="px-4 py-2 text-purple-400 hover:text-white hover:font-semibold gap-2 flex items-center" href="/chat"><PlusSquare /><span>Start new chat</span></Link>
          </div>
        </button>
        <h1 className="text-white text-lg font-semibold">Chat with AI Assistant</h1>
      </nav>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20 h-full w-[60%] mx-auto flex flex-col">
          <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p className="text-gray-500">Loading chat...</p></div>}>
            {isLoadingHistory ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">Loading conversation history...</p>
              </div>
            ) : (
              <ChatWindow
                messages={messages}
                isLoading={isThinking}
              />
            )}
          </Suspense>
          <div className="p-4 px-12 rounded-t-3xl bg-gray-800/10 backdrop-blur-md">
            <ChatBarProps stateBar="chat" handleSubmit={handleSubmit} />
          </div>
        </div>
      </div>
      <BackgroundBeams className="z-[-1]" />
    </main>
  );
}
