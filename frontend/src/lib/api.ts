const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type BookLevel = { price: number; quantity: number; order_count: number };
export type BookSnapshot = {
  bids: BookLevel[];
  asks: BookLevel[];
  best_bid: number | null;
  best_ask: number | null;
  mid: number | null;
  spread: number | null;
};

export type OrderResult = {
  filled_qty: number;
  avg_price: number;
  status: string;
  remaining: number;
  explanation: string;
  fills: { maker_id: number; taker_id: number; price: number; quantity: number }[];
  book: BookSnapshot;
};

export const api = {
  health: () => request<{ status: string }>("/health"),
  getBook: (sessionId = "default") =>
    request<BookSnapshot>(`/api/book?session_id=${encodeURIComponent(sessionId)}`),
  resetBook: (sessionId = "default", mid = 201.42) =>
    request<BookSnapshot>("/api/book/reset", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, mid }),
    }),
  placeOrder: (body: {
    session_id?: string;
    side: "bid" | "ask";
    order_type: "market" | "limit";
    quantity: number;
    limit_price?: number;
  }) =>
    request<OrderResult>("/api/orders", {
      method: "POST",
      body: JSON.stringify({ session_id: "default", ...body }),
    }),
  monteCarlo: (body: Record<string, unknown>) =>
    request<Record<string, unknown>>("/api/monte-carlo/gbm", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  priceOption: (body: Record<string, unknown>) =>
    request<Record<string, unknown>>("/api/options/price", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  lessons: () => request<LessonSummary[]>("/api/lessons"),
  lesson: (id: string) => request<LessonDetail>(`/api/lessons/${id}`),
  progress: (userId = "local") => request<ProgressSummary>(`/api/progress/${userId}`),
  updateProgress: (body: {
    user_id?: string;
    lesson_id: string;
    completed?: boolean;
    quiz_score?: number;
    challenge_passed?: boolean;
  }) =>
    request<ProgressSummary>("/api/progress", {
      method: "POST",
      body: JSON.stringify({ user_id: "local", ...body }),
    }),
};

export type LessonSummary = {
  id: string;
  track: string;
  title: string;
  summary: string;
  order: number;
};

export type LessonDetail = LessonSummary & {
  concept: string;
  guided: string;
  challenge: Record<string, unknown>;
  quiz: Record<string, unknown>;
};

export type ProgressSummary = {
  tracks: { track: string; percent: number; done: number; total: number }[];
  lessons_completed: number;
  lessons_total: number;
  raw: Record<string, unknown>;
};