import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Copy, Loader2, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores/use-auth-store";
import { usePeerInterview } from "../hooks/use-peer-interview";
import { usePeerInterviewSocket } from "../hooks/use-peer-interview-socket";
import { PeerInterviewEvaluation, PeerInterviewMessage } from "../types";

export function PeerInterviewRoomPage() {
  const { t } = useTranslation("peerInterview");
  const { id } = useParams<{ id: string }>();
  const currentUserId = useAuthStore((state) => state.user?.userId);

  const { data: session, isLoading, isError } = usePeerInterview(id);

  const [messages, setMessages] = useState<PeerInterviewMessage[]>([]);
  const [ended, setEnded] = useState(false);
  const [evaluation, setEvaluation] = useState<PeerInterviewEvaluation | null>(
    null,
  );
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session) return;
    setMessages(session.messages);
    setEvaluation(session.evaluation);
    setEnded(session.status === "COMPLETED" || session.status === "ABANDONED");
  }, [session]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleReceiveMessage = useCallback((message: PeerInterviewMessage) => {
    setMessages((prev) =>
      prev.some((m) => m.id === message.id) ? prev : [...prev, message],
    );
  }, []);

  const handleEnded = useCallback(() => {
    setEnded(true);
    toast.info(t("room.endedNotice"));
  }, [t]);

  const handleGraded = useCallback(
    (newEvaluation: PeerInterviewEvaluation) => {
      setEvaluation(newEvaluation);
    },
    [],
  );

  const { sendMessage, endInterview } = usePeerInterviewSocket({
    peerSessionId: session?.id,
    onReceiveMessage: handleReceiveMessage,
    onEnded: handleEnded,
    onGraded: handleGraded,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || ended) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleCopyInviteCode = () => {
    if (!session) return;
    void navigator.clipboard.writeText(session.inviteCode);
    toast.success(t("room.copied"));
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>{t("room.loading")}</p>
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center text-destructive">
        <p>{t("room.loadFailed")}</p>
      </div>
    );
  }

  const isCandidate = currentUserId === session.candidateId;
  const myRole = isCandidate ? "CANDIDATE" : "PEER_INTERVIEWER";

  if (session.status === "WAITING_FOR_PEER") {
    return (
      <div className="w-full pb-10 max-w-lg mx-auto pt-16 text-center space-y-4">
        <Users className="h-10 w-10 text-primary mx-auto" />
        <h1 className="text-xl font-semibold text-foreground">
          {t("room.waitingTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("room.waitingDescription")}
        </p>
        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <span className="font-mono text-lg tracking-widest text-foreground">
              {session.inviteCode}
            </span>
            <Button size="sm" variant="outline" onClick={handleCopyInviteCode}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              {t("room.copyInviteCode")}
            </Button>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground animate-pulse">
          {t("room.polling")}
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden text-sm">
      <header className="shrink-0 border-b border-border px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-foreground">
            {session.problem.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t("room.roleLabel", {
              role: t(`room.role.${myRole}`),
            })}
            {" · "}
            {isCandidate
              ? session.peerInterviewer?.name
              : session.candidate.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={ended ? "outline" : "default"}>
            {ended ? t("room.statusEnded") : t("room.statusActive")}
          </Badge>
          {!ended && (
            <Button size="sm" variant="destructive" onClick={endInterview}>
              {t("room.endInterview")}
            </Button>
          )}
        </div>
      </header>

      <ScrollArea className="flex-1 min-h-0 px-4">
        <div className="max-w-2xl mx-auto py-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">
              {t("room.emptyChat")}
            </p>
          )}
          {messages.map((msg) => {
            const isMine = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none"
                  }`}
                >
                  <p className="text-[10px] opacity-70 mb-0.5">
                    {t(`room.role.${msg.role}`)}
                  </p>
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {evaluation && (
        <div className="shrink-0 border-t border-border px-4 py-3 max-w-2xl mx-auto w-full space-y-2">
          <h2 className="text-sm font-semibold text-foreground">
            {t("room.evaluationTitle")}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("room.candidateScore")}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {evaluation.candidateScore}/100
                </p>
                <p className="text-xs text-muted-foreground">
                  {evaluation.candidateFeedback}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("room.peerInterviewerScore")}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {evaluation.peerInterviewerScore}/100
                </p>
                <p className="text-xs text-muted-foreground">
                  {evaluation.peerInterviewerFeedback}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {ended && !evaluation && (
        <div className="shrink-0 border-t border-border px-4 py-3 text-center text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1.5" />
          {t("room.grading")}
        </div>
      )}

      {!ended && (
        <form
          onSubmit={handleSubmit}
          className="shrink-0 border-t border-border p-3 flex gap-2 max-w-2xl mx-auto w-full"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("room.inputPlaceholder")}
            autoComplete="off"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button type="submit" size="icon" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
