import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputBody, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import logo from "@/assets/scoutai-logo.png";

export const Route = createFileRoute("/_authenticated/scoutai")({
  head: () => ({ meta: [
    { title: "ScoutAI — AthleteScouts" },
    { name: "description", content: "Ask ScoutAI to find trials that fit you or get talent insights as a scout." },
    { property: "og:title", content: "ScoutAI — AthleteScouts" },
    { property: "og:description", content: "AI assistant for trials, tournaments and talent insights in the UAE." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ScoutAIPage,
});

function ScoutAIPage() {
  const { user } = Route.useRouteContext();
  const [initial, setInitial] = useState<UIMessage[] | null>(null);

  useEffect(() => {
    supabase.from("scoutai_messages").select("message_id, role, parts").eq("user_id", user.id).order("created_at").then(({ data, error }) => {
      if (error) toast.error("Couldn't load your ScoutAI history");
      setInitial((data ?? []).map((r) => ({ id: r.message_id, role: r.role as UIMessage["role"], parts: r.parts as UIMessage["parts"] })));
    });
  }, [user.id]);

  if (!initial) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  return <Chat me={user.id} initial={initial} onCleared={() => setInitial([])} />;
}

const SUGGESTIONS = [
  "Which trials fit me right now?",
  "Find U-16 football tryouts in Abu Dhabi",
  "Shortlist sprinters under 18 with the best times",
  "Which tournaments should a cricket scout attend this season?",
];

function Chat({ me, initial, onCleared }: { me: string; initial: UIMessage[]; onCleared: () => void }) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: `scoutai-${me}`,
    messages: initial,
    transport: new DefaultChatTransport({
      api: "/api/scoutai",
      headers: async (): Promise<Record<string, string>> => {
        const { data } = await supabase.auth.getSession();
        return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
      },
    }),
    onError: (e) => {
      let msg = e.message;
      try { msg = JSON.parse(e.message).error ?? msg; } catch { /* plain text */ }
      toast.error(msg || "ScoutAI couldn't answer. Please try again.");
    },
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => { if (!busy) ref.current?.focus(); }, [busy]);

  const send = (t: string) => {
    if (!t.trim() || busy) return;
    sendMessage({ text: t.trim() });
    setText("");
  };
  const clear = async () => {
    const { error } = await supabase.from("scoutai_messages").delete().eq("user_id", me);
    if (error) { toast.error("Couldn't clear the chat"); return; }
    setMessages([]); onCleared();
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-10rem-env(safe-area-inset-bottom))] min-h-80 max-w-3xl flex-col md:h-[calc(100dvh-8rem)]">
      <div className="mb-3 flex items-center gap-3">
        <img src={logo} alt="ScoutAI" width={40} height={40} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-extrabold uppercase leading-none">Scout<span className="text-primary">AI</span></h1>
          <p className="text-xs text-muted-foreground">Trials that fit you · talent insights for scouts</p>
        </div>
        {messages.length > 0 && <Button variant="ghost" size="sm" onClick={clear} disabled={busy}><RotateCcw className="h-4 w-4" />Clear chat</Button>}
      </div>

      <Conversation className="min-h-0 flex-1 border-y border-border bg-background">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState>
              <img src={logo} alt="" width={96} height={96} className="h-24 w-24" />
              <div className="font-display text-2xl font-bold uppercase">How can I help you scout?</div>
              <div className="mt-3 grid w-full max-w-lg gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <Button key={s} type="button" variant="outline" onClick={() => send(s)} className="h-auto whitespace-normal p-3 text-left text-sm">{s}</Button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent className={m.role === "user" ? "bg-primary text-primary-foreground" : "bg-transparent"}>
                {m.parts.map((p, i) => p.type === "text" ? (m.role === "assistant" ? <MessageResponse key={i}>{p.text}</MessageResponse> : <span key={i} className="whitespace-pre-wrap">{p.text}</span>) : null)}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && <Shimmer className="text-sm">Scouting the data…</Shimmer>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput className="mt-3" onSubmit={(msg) => send(msg.text)}>
        <PromptInputBody>
          <PromptInputTextarea ref={ref} autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about trials, tournaments or athletes…" />
        </PromptInputBody>
        <PromptInputFooter className="justify-end">
          <PromptInputSubmit status={status} onClick={busy ? (e) => { e.preventDefault(); stop(); } : undefined} disabled={!busy && !text.trim()} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
