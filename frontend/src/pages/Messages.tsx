import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MessageCircle, Search } from "lucide-react";
import EmptyState from "../components/EmptyState";
import { api, ApiError, type Conversation } from "../api/client";

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(
    searchParams.get("chat")
  );
  const [messages, setMessages] = useState<
    { id: string; content: string; isOwn: boolean; createdAt: string }[]
  >([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");

  const loadConversations = () =>
    api
      .getConversations()
      .then(({ conversations: c }) => setConversations(c))
      .catch(() => setConversations([]));

  useEffect(() => {
    loadConversations().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const chatId = searchParams.get("chat");
    const username = searchParams.get("user");

    if (chatId) {
      setSelected(chatId);
      return;
    }

    if (username) {
      setError("");
      api
        .startConversation(username)
        .then(({ conversation }) => {
          setConversations((prev) => {
            const exists = prev.some((c) => c.id === conversation.id);
            return exists ? prev : [conversation, ...prev];
          });
          setSelected(conversation.id);
          setSearchParams({ chat: conversation.id });
        })
        .catch((err) => {
          setError(err instanceof ApiError ? err.message : "Could not start chat");
        });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!selected) return;
    api
      .getMessages(selected)
      .then(({ messages: m }) => setMessages(m))
      .catch(() => setMessages([]));
  }, [selected]);

  const openChat = (id: string) => {
    setSelected(id);
    setSearchParams({ chat: id });
  };

  const sendMessage = async () => {
    if (!selected || !newMessage.trim()) return;
    try {
      const { message } = await api.sendMessage(selected, newMessage);
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
      loadConversations();
    } catch {
      setError("Failed to send message");
    }
  };

  const selectedConvo = conversations.find((c) => c.id === selected);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Messages</h2>
          <p className="mt-1 text-sm text-muted">Chat with your friends</p>
        </div>
        <Link
          to="/search"
          className="rounded-xl bg-ape-lime/10 px-4 py-2 text-sm font-semibold text-ape-lime transition hover:bg-ape-lime/20"
        >
          Find friends
        </Link>
      </div>

      {error && (
        <div className="rounded-xl bg-ape-coral/10 px-4 py-3 text-sm text-ape-coral">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ape-lime border-t-transparent" />
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          description="Search for people, add them as friends, then tap Message on their profile to chat."
          action={
            <Link
              to="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-ape-lime/10 px-5 py-2.5 text-sm font-semibold text-ape-lime transition hover:bg-ape-lime/20"
            >
              <Search size={16} /> Search for friends
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-2">
            {conversations.map((msg) => (
              <button
                key={msg.id}
                onClick={() => openChat(msg.id)}
                className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left transition ${
                  selected === msg.id
                    ? "glass shadow-glow-lime ring-1 ring-ape-lime/20"
                    : "glass hover:shadow-glow-lime"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-ape-lime/20 to-ape-emerald/20 text-sm font-bold">
                  {msg.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{msg.user}</p>
                    <span className="text-xs text-muted">{msg.time}</span>
                  </div>
                  <p className="truncate text-sm text-muted">
                    {msg.lastMessage || "No messages yet — say hello!"}
                  </p>
                </div>
                {msg.unread && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ape-coral text-[10px] font-bold">
                    {msg.unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          {selected && selectedConvo && (
            <div className="rounded-2xl glass p-5 shadow-card">
              <div className="mb-4 flex items-center gap-3 border-b border-border/40 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ape-lime/20 text-xs font-bold">
                  {selectedConvo.avatar}
                </div>
                <div>
                  <p className="font-semibold">{selectedConvo.user}</p>
                  {selectedConvo.username && (
                    <Link
                      to={`/u/${selectedConvo.username}`}
                      className="text-xs text-ape-lime hover:underline"
                    >
                      @{selectedConvo.username}
                    </Link>
                  )}
                </div>
              </div>

              {messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">
                  No messages yet. Say hello!
                </p>
              ) : (
                <div className="mb-4 max-h-64 space-y-3 overflow-y-auto">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.isOwn
                          ? "ml-auto rounded-br-sm bg-ape-lime/15"
                          : "rounded-bl-sm bg-elevated"
                      }`}
                    >
                      {m.content}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl border border-border bg-ink px-4 py-2.5 text-sm outline-none focus:border-ape-lime/50"
                />
                <button
                  onClick={sendMessage}
                  className="rounded-xl bg-ape-lime px-4 py-2.5 text-sm font-bold text-void transition hover:opacity-90"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
