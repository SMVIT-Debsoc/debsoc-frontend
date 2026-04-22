"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {motion} from "framer-motion";
import {Menu, Moon, PenSquare, Search, Send, Sun, X} from "lucide-react";

export type PlaceRecommendation = {
  id?: string;
  name: string;
  address?: string;
  rating?: number | null;
  review_count?: number | null;
  distance_km?: number;
  maps_url: string;
  image_url: string | null;
  place_uri: string | null;
  directions_uri: string | null;
  reviews_uri: string | null;
  photos_uri: string | null;
  why_recommended?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: string;
  places?: PlaceRecommendation[];
  access_state?: ChatResponse["access_state"];
};

type Conversation = {
  id: string;
  preview: string;
  title: string;
};

type ChatResponse = {
  reply: string;
  places: PlaceRecommendation[];
  session_expires_in_seconds: number;
  session_warning: string | null;
  cooldown_seconds_remaining: number | null;
  access_state: "active_window" | "cooldown" | "blocked_scope" | null;
};

type ChatErrorResponse = {
  error?: string;
  request_id?: string;
};

const INITIAL_CONVERSATION_ID = "pending-session";
const SESSION_STORAGE_KEY = "pd_virtual_assistant_session_id";

const initialConversations: Conversation[] = [
  {
    id: INITIAL_CONVERSATION_ID,
    preview: "New conversation",
    title: "Current Session",
  },
];

const initialMessages: Record<string, ChatMessage[]> = {
  [INITIAL_CONVERSATION_ID]: [],
};

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `smvitpd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function sendChat(
  sessionId: string,
  message: string,
): Promise<ChatResponse> {
  const response = await fetch("/api/smvitpd/chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({session_id: sessionId, message}),
  });

  const data = (await response.json()) as ChatResponse | ChatErrorResponse;

  if (!response.ok) {
    const retryAfter = response.headers.get("Retry-After");
    const suffix = retryAfter ? ` Try again in ${retryAfter} seconds.` : "";
    throw new Error(
      `${"error" in data && data.error ? data.error : `HTTP ${response.status}`}${suffix}`,
    );
  }

  return data as ChatResponse;
}

async function resetChatSession(sessionId: string) {
  try {
    await fetch("/api/smvitpd/session-reset", {
      method: "DELETE",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({session_id: sessionId}),
    });
  } catch {
    // The local conversation can still be removed if backend reset is unavailable.
  }
}

function timeStamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EmptyState({darkMode}: {darkMode: boolean}) {
  const fullText = "Welcome to Fultung";
  const [displayText, setDisplayText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) {
        clearInterval(interval);
        setIsTypingComplete(true);
      }
    }, 70);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{opacity: 0, y: 16}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.28, ease: "easeOut"}}
      className="flex min-h-full items-center justify-center"
    >
      <div className="mx-auto max-w-md text-center">
        <p
          className={`text-3xl font-semibold tracking-tight ${
            darkMode ? "text-[#fff1ea]" : "text-[#4d0000]"
          }`}
          style={{
            fontFamily: '"Diostellary Strong", var(--font-geist-sans)',
          }}
        >
          {displayText}
          {!isTypingComplete && (
            <motion.span
              animate={{opacity: [1, 0, 1]}}
              transition={{duration: 0.8, repeat: Infinity}}
              className="inline-block w-[2px] h-[1em] ml-1 bg-current align-middle"
            />
          )}
        </p>
        <motion.p
          initial={{opacity: 0}}
          animate={{opacity: isTypingComplete ? 1 : 0}}
          transition={{duration: 0.5}}
          className={`mt-3 text-base leading-7 ${
            darkMode ? "text-[#f1d7cb]/62" : "text-[#171717]/55"
          }`}
        >
          Feel free to drop your questions!
        </motion.p>
      </div>
    </motion.div>
  );
}

function TypingIndicator({darkMode}: {darkMode: boolean}) {
  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      className="flex justify-start"
    >
      <div
        className={`flex items-center gap-4 rounded-[24px] rounded-bl-md px-4 py-3 ${
          darkMode
            ? "border border-white/10 bg-[#221c1a]"
            : "border border-[#efe3d8] bg-[#fbf8f4]"
        }`}
      >
        <motion.div
          animate={{rotate: [0, -2, 2, 0], scale: [1, 1.02, 1]}}
          transition={{
            duration: 1.8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="shrink-0"
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              cx="24"
              cy="24"
              r="24"
              fill={darkMode ? "#2A201D" : "#F5E9E3"}
            />
            <circle
              cx="24"
              cy="21"
              r="11"
              fill={darkMode ? "#F0C9B4" : "#F2C7AE"}
            />
            <path
              d="M15 20C15 14.4 19.4 10 25 10C30.6 10 34 13.9 34 19.2V22H15V20Z"
              fill={darkMode ? "#6A1616" : "#7A1A1A"}
            />
            <motion.path
              d="M18 17.5C19.2 16.5 20.5 16 22 16"
              stroke={darkMode ? "#2A201D" : "#3A2A27"}
              strokeWidth="1.8"
              strokeLinecap="round"
              animate={{y: [0, -0.6, 0]}}
              transition={{
                duration: 1.4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
            <motion.path
              d="M26 16C27.5 16 28.8 16.5 30 17.5"
              stroke={darkMode ? "#2A201D" : "#3A2A27"}
              strokeWidth="1.8"
              strokeLinecap="round"
              animate={{y: [0, -0.6, 0]}}
              transition={{
                duration: 1.4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 0.12,
              }}
            />
            <motion.ellipse
              cx="20.5"
              cy="22.5"
              rx="1.3"
              ry="1.9"
              fill={darkMode ? "#1C1412" : "#231917"}
              style={{transformOrigin: "20.5px 22.5px"}}
              animate={{scaleY: [1, 0.25, 1]}}
              transition={{
                duration: 2.2,
                repeat: Number.POSITIVE_INFINITY,
                times: [0, 0.08, 0.16],
                ease: "easeInOut",
              }}
            />
            <motion.ellipse
              cx="27.5"
              cy="22.5"
              rx="1.3"
              ry="1.9"
              fill={darkMode ? "#1C1412" : "#231917"}
              style={{transformOrigin: "27.5px 22.5px"}}
              animate={{scaleY: [1, 0.25, 1]}}
              transition={{
                duration: 2.2,
                repeat: Number.POSITIVE_INFINITY,
                times: [0, 0.08, 0.16],
                ease: "easeInOut",
                delay: 0.06,
              }}
            />
            <motion.path
              d="M21 29C22.6 30.2 25.4 30.2 27 29"
              stroke={darkMode ? "#8C4A48" : "#A05855"}
              strokeWidth="1.8"
              strokeLinecap="round"
              style={{transformOrigin: "24px 29px"}}
              animate={{scaleY: [1, 0.6, 1], scaleX: [1, 1.08, 1]}}
              transition={{
                duration: 1.6,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
            <path
              d="M14 41C15.8 34.8 19.2 32 24 32C28.8 32 32.2 34.8 34 41"
              fill={darkMode ? "#7A1A1A" : "#8A2020"}
            />
          </svg>
        </motion.div>

        <div className="min-w-0">
          <p
            className={`text-sm font-medium ${darkMode ? "text-[#fff1ea]" : "text-[#4d0000]"}`}
          >
            Fultung is thinking
          </p>
          <div className="mt-2 flex items-center gap-2">
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                animate={{
                  y: [0, -5, 0],
                  opacity: [0.45, 1, 0.45],
                }}
                transition={{
                  duration: 0.9,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: index * 0.14,
                  ease: "easeInOut",
                }}
                className={`h-2.5 w-2.5 rounded-full ${
                  darkMode ? "bg-[#f1d7cb]/60" : "bg-[#4d0000]/55"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PlaceCard({
  place,
  darkMode,
}: {
  place: PlaceRecommendation;
  darkMode: boolean;
}) {
  const title = place.name || "Recommended place";
  const rating =
    typeof place.rating === "number" ? place.rating.toFixed(1) : null;
  const reviewCount =
    typeof place.review_count === "number" ? place.review_count : null;
  const distance =
    typeof place.distance_km === "number"
      ? `${place.distance_km.toFixed(1)} km`
      : null;

  return (
    <article
      className={`mt-3 overflow-hidden rounded-[24px] border ${darkMode ? "border-white/10 bg-[#1c1715]" : "border-[#efe3d8] bg-white"}`}
    >
      {place.image_url ? (
        <img
          src={place.image_url}
          alt={place.name}
          loading="lazy"
          className="h-48 w-full object-cover"
        />
      ) : (
        <div
          aria-label="No place photo available"
          className={`h-48 w-full ${darkMode ? "bg-[#231c1a]" : "bg-[#f5efe8]"}`}
        />
      )}
      <div className={`p-4 ${darkMode ? "text-[#fff1ea]" : "text-[#171717]"}`}>
        <h3 className="text-lg font-semibold">{title}</h3>
        {place.address ? (
          <p className="mt-1 text-sm opacity-80">{place.address}</p>
        ) : null}
        <p className="mt-2 text-sm opacity-70">
          {rating ? `${rating} rating` : "Rating unavailable"}
          {reviewCount !== null ? ` | ${reviewCount} reviews` : ""}
          {distance ? ` | ${distance}` : ""}
        </p>
        {place.why_recommended ? (
          <p className="mt-2 text-sm italic opacity-90">
            {place.why_recommended}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <a
            href={place.maps_url}
            target="_blank"
            rel="noreferrer"
            className={`rounded-full px-4 py-1.5 font-medium ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"}`}
          >
            Open in Maps
          </a>
          {place.directions_uri ? (
            <a
              href={place.directions_uri}
              target="_blank"
              rel="noreferrer"
              className={`rounded-full px-4 py-1.5 font-medium ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"}`}
            >
              Directions
            </a>
          ) : null}
          {place.reviews_uri ? (
            <a
              href={place.reviews_uri}
              target="_blank"
              rel="noreferrer"
              className={`rounded-full px-4 py-1.5 font-medium ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"}`}
            >
              Reviews
            </a>
          ) : null}
          {place.photos_uri ? (
            <a
              href={place.photos_uri}
              target="_blank"
              rel="noreferrer"
              className={`rounded-full px-4 py-1.5 font-medium ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"}`}
            >
              Photos
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function MessageBubble({
  darkMode,
  message,
}: {
  darkMode: boolean;
  message: ChatMessage;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      layout
      initial={{opacity: 0, scale: 0.96, y: 20}}
      animate={{opacity: 1, scale: 1, y: 0}}
      transition={{duration: 0.22, ease: "easeOut"}}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className="max-w-[92%] sm:max-w-[78%] xl:max-w-[72%]">
        <div
          className={`rounded-[28px] px-5 py-4 shadow-[0_18px_60px_rgba(77,0,0,0.12)] ${
            isUser
              ? darkMode
                ? "rounded-br-md bg-[#7a1111] text-white"
                : "rounded-br-md bg-[#4d0000] text-white"
              : darkMode
                ? "rounded-bl-md border border-white/10 bg-[#221c1a] text-[#f6eee7]"
                : "rounded-bl-md border border-[#efe6dd] bg-[#fbf8f4] text-[#171717]"
          }`}
        >
          <p className="whitespace-pre-line text-[15px] leading-7">
            {message.text}
          </p>
        </div>
        {message.places?.map((place, index) => (
          <PlaceCard
            key={place.id ?? `${place.name}-${index}`}
            darkMode={darkMode}
            place={place}
          />
        ))}
        <div
          className={`mt-2 flex items-center justify-between px-1 text-xs uppercase tracking-[0.2em] ${
            isUser
              ? darkMode
                ? "text-[#f1d7cb]/56"
                : "text-[#4d0000]/60"
              : darkMode
                ? "text-[#f6eee7]/38"
                : "text-[#171717]/35"
          }`}
        >
          <span>{message.timestamp}</span>
          {message.access_state === "blocked_scope" ? (
            <span className="text-red-500 font-semibold ml-2">Blocked</span>
          ) : message.access_state === "cooldown" ? (
            <span className="text-orange-500 font-semibold ml-2">Cooldown</span>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function Sidebar({
  activeConversationId,
  conversations,
  darkMode,
  mobile,
  onClose,
  onConversationSelect,
  onDeleteConversation,
  onNewConversation,
}: {
  activeConversationId: string;
  conversations: Conversation[];
  darkMode: boolean;
  mobile?: boolean;
  onClose?: () => void;
  onConversationSelect: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}) {
  const [swipedConversationId, setSwipedConversationId] = useState<
    string | null
  >(null);
  const touchStartXRef = useRef(0);
  const touchActiveConversationRef = useRef<string | null>(null);

  const resetSwipeTracking = () => {
    touchStartXRef.current = 0;
    touchActiveConversationRef.current = null;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p
            className={`text-xs uppercase tracking-[0.28em] ${darkMode ? "text-[#f1d7cb]/55" : "text-[#4d0000]/60"}`}
          >
            Atelier
          </p>
          <h1
            className={`mt-2 text-2xl font-semibold ${darkMode ? "text-[#fff1ea]" : "text-[#4d0000]"}`}
          >
            Conversations
          </h1>
        </div>
        {mobile ? (
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full p-2 ${darkMode ? "border border-white/10 text-[#f1d7cb]" : "border border-[#4d0000]/15 text-[#4d0000]"}`}
            aria-label="Close history"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onNewConversation}
        className="mb-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#4d0000] px-4 py-3 text-sm font-medium text-white"
      >
        <PenSquare size={16} />
        New Conversation
      </button>

      <div
        className={`mb-5 flex items-center gap-3 rounded-full px-4 py-3 text-sm ${darkMode ? "border border-white/10 bg-white/5 text-[#f1d7cb]/55" : "border border-[#4d0000]/10 bg-white/80 text-[#4d0000]/55"}`}
      >
        <Search size={16} />
        Search your history
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {conversations.map((chat) => (
          <div
            key={`${chat.id}-${mobile ? "mobile" : "desktop"}`}
            className="relative overflow-hidden rounded-3xl"
            onTouchStart={(event) => {
              touchStartXRef.current = event.touches[0].clientX;
              touchActiveConversationRef.current = chat.id;
            }}
            onTouchEnd={(event) => {
              if (touchActiveConversationRef.current !== chat.id) {
                resetSwipeTracking();
                return;
              }

              const deltaX =
                event.changedTouches[0].clientX - touchStartXRef.current;
              if (deltaX < -48) {
                setSwipedConversationId(chat.id);
              } else if (deltaX > 24) {
                setSwipedConversationId(null);
              }
              resetSwipeTracking();
            }}
          >
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              <button
                type="button"
                onClick={() => {
                  setSwipedConversationId(null);
                  onDeleteConversation(chat.id);
                }}
                className={`h-[calc(100%-8px)] rounded-[22px] px-5 text-sm font-medium text-white transition ${
                  swipedConversationId === chat.id
                    ? "translate-x-0 opacity-100"
                    : "pointer-events-none translate-x-6 opacity-0"
                } ${darkMode ? "bg-[#8f1d1d]" : "bg-[#a11414]"}`}
              >
                Delete
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (swipedConversationId === chat.id) {
                  setSwipedConversationId(null);
                  return;
                }
                onConversationSelect(chat.id);
                onClose?.();
              }}
              className={`relative z-10 w-full rounded-3xl border px-4 py-4 text-left transition-transform duration-200 ${
                swipedConversationId === chat.id
                  ? "-translate-x-24"
                  : "translate-x-0"
              } ${
                chat.id === activeConversationId
                  ? darkMode
                    ? "border-white/10 bg-white/10"
                    : "border-[#4d0000]/10 bg-white"
                  : darkMode
                    ? "border-transparent bg-white/[0.03] hover:bg-white/[0.07]"
                    : "border-transparent bg-white/40 hover:bg-white/80"
              }`}
            >
              <p
                className={`font-medium ${darkMode ? "text-[#fff1ea]" : "text-[#171717]"}`}
              >
                {chat.title}
              </p>
              <p
                className={`mt-1 text-sm ${darkMode ? "text-[#f1d7cb]/58" : "text-[#171717]/55"}`}
              >
                {chat.preview}
              </p>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SMVITPDChatPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [isThemeHydrated, setIsThemeHydrated] = useState(false);
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState(
    initialConversations[0].id,
  );
  const [conversationState, setConversationState] =
    useState<Record<string, ChatMessage[]>>(initialMessages);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [value, setValue] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<number | null>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("smvitpd-theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
    }

    const savedSessionId =
      window.localStorage.getItem(SESSION_STORAGE_KEY) ?? createSessionId();
    window.localStorage.setItem(SESSION_STORAGE_KEY, savedSessionId);

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === INITIAL_CONVERSATION_ID
          ? {...conversation, id: savedSessionId}
          : conversation,
      ),
    );
    setConversationState((current) => {
      if (!current[INITIAL_CONVERSATION_ID]) return current;

      const next = {
        ...current,
        [savedSessionId]: current[INITIAL_CONVERSATION_ID],
      };
      delete next[INITIAL_CONVERSATION_ID];
      return next;
    });
    setIsTyping((current) => {
      const next = {
        ...current,
        [savedSessionId]: current[INITIAL_CONVERSATION_ID] ?? false,
      };
      delete next[INITIAL_CONVERSATION_ID];
      return next;
    });
    setActiveConversationId(savedSessionId);
    setIsThemeHydrated(true);
  }, []);

  useEffect(() => {
    if (!isThemeHydrated) {
      return;
    }
    document.documentElement.classList.toggle("smvitpd-dark", darkMode);
    window.localStorage.setItem("smvitpd-theme", darkMode ? "dark" : "light");
  }, [darkMode, isThemeHydrated]);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const syncComposerHeight = () => {
      document.documentElement.style.setProperty(
        "--smvitpd-composer-height",
        `${element.offsetHeight}px`,
      );
    };

    syncComposerHeight();
    const observer = new ResizeObserver(syncComposerHeight);
    observer.observe(element);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty(
        "--smvitpd-composer-height",
      );
    };
  }, []);

  useEffect(() => {
    const container = messageContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [activeConversationId, conversationState, isTyping]);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) ?? conversations[0],
    [activeConversationId, conversations],
  );

  const createConversationRecord = (count: number) => {
    const id = createSessionId();
    return {
      conversation: {
        id,
        preview: "Welcome to SMVIT PD",
        title: `New conversation ${count > 3 ? count - 2 : ""}`.trim(),
      },
      id,
    };
  };

  const handleNewConversation = () => {
    const {conversation, id} = createConversationRecord(
      conversations.length + 1,
    );
    window.localStorage.setItem(SESSION_STORAGE_KEY, id);
    setConversations((current) => [conversation, ...current]);
    setConversationState((current) => ({
      ...current,
      [id]: [],
    }));
    setIsTyping((current) => ({
      ...current,
      [id]: false,
    }));
    setActiveConversationId(id);
    setSidebarOpen(false);
  };

  const handleConversationSelect = (conversationId: string) => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, conversationId);
    setActiveConversationId(conversationId);
  };

  const handleDeleteConversation = (conversationId: string) => {
    void resetChatSession(conversationId);
    const remaining = conversations.filter(
      (conversation) => conversation.id !== conversationId,
    );
    if (typingTimer.current) {
      window.clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }

    if (remaining.length === 0) {
      const {conversation, id} = createConversationRecord(1);
      window.localStorage.setItem(SESSION_STORAGE_KEY, id);
      setConversations([conversation]);
      setConversationState({[id]: []});
      setIsTyping({[id]: false});
      setActiveConversationId(id);
      return;
    }

    setConversations(remaining);
    setConversationState((current) => {
      const next = {...current};
      delete next[conversationId];
      return next;
    });
    setIsTyping((current) => {
      const next = {...current};
      delete next[conversationId];
      return next;
    });

    if (activeConversationId === conversationId) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, remaining[0].id);
      setActiveConversationId(remaining[0].id);
    }
  };

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const conversationId = activeConversationId;
    window.localStorage.setItem(SESSION_STORAGE_KEY, conversationId);
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
      timestamp: timeStamp(),
    };

    setConversationState((current) => ({
      ...current,
      [conversationId]: [...(current[conversationId] ?? []), userMessage],
    }));
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              preview: trimmed,
              title: conversation.title.startsWith("New conversation")
                ? trimmed.slice(0, 32) || conversation.title
                : conversation.title,
            }
          : conversation,
      ),
    );
    setIsTyping((current) => ({
      ...current,
      [conversationId]: true,
    }));
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "54px";
    }

    try {
      const data = await sendChat(conversationId, trimmed);

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        text: data.session_warning
          ? `${data.reply}\n\nSession note: ${data.session_warning}`
          : data.reply,
        timestamp: timeStamp(),
        places: data.places ?? [],
        access_state: data.access_state,
      };

      setConversationState((current) => ({
        ...current,
        [conversationId]: [...(current[conversationId] ?? []), aiMessage],
      }));
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        text:
          error instanceof Error
            ? `Error: ${error.message}`
            : "An unexpected error occurred.",
        timestamp: timeStamp(),
      };
      setConversationState((current) => ({
        ...current,
        [conversationId]: [...(current[conversationId] ?? []), errorMessage],
      }));
    } finally {
      setIsTyping((current) => ({
        ...current,
        [conversationId]: false,
      }));
    }
  };

  return (
    <main
      className={`h-dvh overflow-hidden ${darkMode ? "bg-[linear-gradient(180deg,#14110f_0%,#1b1513_100%)] text-[#f6eee7]" : "bg-[linear-gradient(180deg,#faf7f2_0%,#f6f3ee_100%)] text-[#171717]"}`}
    >
      <div
        className={`relative flex h-full w-full overflow-hidden ${darkMode ? "bg-[#171210]" : "bg-white/90"}`}
      >
        <button
          type="button"
          className={`absolute inset-0 z-30 transition-opacity duration-200 lg:hidden ${
            sidebarOpen
              ? darkMode
                ? "pointer-events-auto bg-black/38 opacity-100"
                : "pointer-events-auto bg-[#1f1310]/18 opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          onClick={() => setSidebarOpen(false)}
          aria-label="Close conversation drawer"
        />

        <motion.aside
          animate={{x: sidebarOpen ? 0 : "-102%"}}
          initial={false}
          transition={{duration: 0.22, ease: [0.22, 1, 0.36, 1]}}
          className={`absolute inset-y-0 left-0 z-[1100] flex w-[88%] max-w-sm flex-col overflow-hidden p-5 pb-[calc(var(--smvitpd-composer-height,120px)+1rem)] will-change-transform lg:hidden ${
            darkMode
              ? "border-r border-white/10 bg-[#1b1513]"
              : "border-r border-[#4d0000]/10 bg-[#f4eee8]"
          }`}
        >
          <Sidebar
            activeConversationId={activeConversationId}
            conversations={conversations}
            darkMode={darkMode}
            mobile
            onClose={() => setSidebarOpen(false)}
            onConversationSelect={handleConversationSelect}
            onDeleteConversation={handleDeleteConversation}
            onNewConversation={handleNewConversation}
          />
        </motion.aside>

        <aside
          className={`hidden w-80 flex-col p-6 xl:w-96 xl:p-7 lg:flex ${darkMode ? "border-r border-white/10 bg-[#1b1513]" : "border-r border-[#4d0000]/10 bg-[#f4eee8]"}`}
        >
          <Sidebar
            activeConversationId={activeConversationId}
            conversations={conversations}
            darkMode={darkMode}
            onConversationSelect={handleConversationSelect}
            onDeleteConversation={handleDeleteConversation}
            onNewConversation={handleNewConversation}
          />
        </aside>

        <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <header
            className={`flex items-center justify-between px-4 py-4 text-white sm:px-6 lg:px-10 lg:py-5 xl:px-14 ${darkMode ? "border-b border-white/10 bg-[#090707]" : "border-b border-[#4d0000]/10 bg-[#4d0000]"}`}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen((current) => !current)}
                className="rounded-full border border-white/20 p-2 lg:hidden"
                aria-label="Toggle history"
              >
                <Menu size={18} />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/60">
                  SMVITPD Assistant
                </p>
                <h2 className="text-lg font-semibold">
                  {activeConversation?.title ?? "Conversation"}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDarkMode((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/90"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </header>

          <div
            ref={messageContainerRef}
            className="flex-1 space-y-6 overflow-y-auto px-4 py-6 pb-[calc(var(--smvitpd-composer-height,120px)+1.5rem)] sm:px-6 lg:px-10 lg:py-8 xl:px-14"
          >
            {(conversationState[activeConversationId] ?? []).length === 0 &&
            !isTyping[activeConversationId] ? (
              <EmptyState darkMode={darkMode} />
            ) : null}

            {(conversationState[activeConversationId] ?? []).map((message) => (
              <MessageBubble
                key={message.id}
                darkMode={darkMode}
                message={message}
              />
            ))}

            {isTyping[activeConversationId] ? (
              <TypingIndicator darkMode={darkMode} />
            ) : null}
          </div>

          <div
            ref={wrapperRef}
            className={`fixed inset-x-0 bottom-0 z-[1000] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 lg:static lg:px-10 lg:py-5 lg:pb-5 xl:px-14 ${
              darkMode
                ? "border-t border-white/10 bg-[#161210] shadow-[0_-6px_18px_rgba(0,0,0,0.16)]"
                : "border-t border-[#4d0000]/10 bg-white/92 shadow-[0_-12px_30px_rgba(35,20,16,0.08)]"
            }`}
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSend();
              }}
              className={`mx-auto flex w-full max-w-4xl items-end gap-3 rounded-[30px] p-3 lg:max-w-none ${
                darkMode
                  ? "border border-white/10 bg-[#211a18]"
                  : "border border-[#4d0000]/10 bg-[#fffdfa]"
              }`}
            >
              <label className="flex-1">
                <span className="sr-only">Message input</span>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={value}
                  onChange={(event) => {
                    setValue(event.target.value);
                    event.currentTarget.style.height = "54px";
                    event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask about a place, route, or anything else..."
                  className={`max-h-40 min-h-[54px] w-full resize-none bg-transparent px-2 py-3 text-[15px] outline-none ${
                    darkMode
                      ? "text-[#f6eee7] placeholder:text-[#f1d7cb]/38"
                      : "text-[#171717] placeholder:text-[#171717]/40"
                  }`}
                />
              </label>
              <motion.button
                whileTap={{scale: 0.96}}
                whileHover={{scale: 1.02}}
                type="submit"
                disabled={!value.trim()}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#4d0000] text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Send size={18} />
              </motion.button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
