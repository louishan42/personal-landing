const API_BASE = import.meta.env.VITE_API_URL || "/api";

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

function getToken(): string | null {
  return localStorage.getItem("lifeverse_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    const apiUrl = import.meta.env.VITE_API_URL || "/api";
    throw new ApiError(
      import.meta.env.PROD && !import.meta.env.VITE_API_URL
        ? "Backend not connected. Add VITE_API_URL on Vercel → https://personal-landing-buzb.onrender.com/api"
        : `Cannot reach backend at ${apiUrl}. Check that the server is running.`,
      0
    );
  }

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await res.json().catch(() => ({ error: "Request failed" }));
      throw new ApiError(body.error || "Request failed", res.status);
    }
    throw new ApiError(
      `Backend error (${res.status}). Restart backend: cd backend && npm run dev`,
      res.status
    );
  }

  return res.json();
}

export interface UserStats {
  followers: number;
  following: number;
  moments: number;
  experiences: number;
  memories: number;
  timelineEntries: number;
  countries: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  location: string;
  avatarUrl: string | null;
  avatar: string;
  isAdmin: boolean;
  profileSetupComplete: boolean;
  stats: UserStats;
}

export interface MomentMedia {
  id: string;
  url: string;
  type: string;
  order: number;
}

export interface MomentComment {
  id: string;
  content: string;
  time: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
}

export interface Moment {
  id: string;
  caption: string;
  location: string;
  type: string;
  media?: MomentMedia[];
  mediaCount: number;
  likes: number;
  comments: number;
  time: string;
  liked?: boolean;
  commentList?: MomentComment[];
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
}

export interface TimelineGroup {
  month: string;
  year: number;
  items: { id: string; emoji: string; title: string; date: string }[];
}

export interface Conversation {
  id: string;
  user: string;
  username?: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread?: number;
}

export interface Notification {
  id: string;
  type: string;
  text: string;
  time: string;
  read: boolean;
  relatedUserId?: string | null;
  relatedUsername?: string | null;
}

export type FriendStatus = "NONE" | "REQUEST_SENT" | "REQUEST_RECEIVED" | "FRIENDS";

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  isAdmin: boolean;
  profileSetupComplete: boolean;
  hasGoogle: boolean;
  moments: number;
  followers: number;
  following: number;
  createdAt: string;
}

export const api = {
  googleLogin: (credential: string) =>
    request<{ token: string; user: User; needsSetup: boolean }>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    }),

  adminLogin: (email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  checkUsername: (username: string) =>
    request<{ available: boolean; error?: string }>(
      `/auth/check-username/${encodeURIComponent(username)}`
    ),

  setupProfile: (data: { username: string; displayName?: string; location?: string }) =>
    request<{ token: string; user: User }>("/auth/setup-profile", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request<{ user: User }>("/auth/me"),

  updateProfile: (data: Partial<Pick<User, "displayName" | "bio" | "location">>) =>
    request<{ user: User }>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getFeed: () => request<{ moments: Moment[] }>("/moments/feed"),

  createMoment: (data: {
    caption?: string;
    location?: string;
    type?: string;
    photos?: string[];
  }) =>
    request<{ moment: Moment }>("/moments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMoment: (id: string) => request<{ moment: Moment }>(`/moments/${id}`),

  commentMoment: (id: string, content: string) =>
    request<{ comment: MomentComment; comments: number }>(`/moments/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  likeMoment: (id: string) =>
    request<{ liked: boolean; likes: number }>(`/moments/${id}/like`, {
      method: "POST",
    }),

  explore: () =>
    request<{ locations: { name: string; count: number }[] }>("/moments/explore"),

  search: (q: string) =>
    request<{ users: User[]; moments: Moment[] }>(`/search?q=${encodeURIComponent(q)}`),

  getUser: (username: string) =>
    request<{
      user: User;
      friendStatus: FriendStatus;
      followStatus: string | null;
      isOwnProfile: boolean;
    }>(`/users/${encodeURIComponent(username)}`),

  followUser: (username: string) =>
    request<{ status: string; friendStatus: FriendStatus }>(
      `/users/${encodeURIComponent(username)}/follow`,
      { method: "POST" }
    ),

  acceptFriend: (username: string) =>
    request<{ status: string; friendStatus: FriendStatus }>(
      `/users/${encodeURIComponent(username)}/friend/accept`,
      { method: "POST" }
    ),

  rejectFriend: (username: string) =>
    request<{ status: string; friendStatus: FriendStatus }>(
      `/users/${encodeURIComponent(username)}/friend/reject`,
      { method: "POST" }
    ),

  unfollowUser: (username: string) =>
    request<{ status: string }>(`/users/${encodeURIComponent(username)}/follow`, {
      method: "DELETE",
    }),

  getFriends: () => request<{ friends: User[] }>("/users/friends/list"),

  startConversation: (username: string) =>
    request<{ conversation: Conversation }>("/messages/start", {
      method: "POST",
      body: JSON.stringify({ username }),
    }),

  getUserMoments: (username: string) =>
    request<{ moments: Moment[]; locked?: boolean }>(
      `/users/${encodeURIComponent(username)}/moments`
    ),

  getTimeline: () => request<{ timeline: TimelineGroup[] }>("/timeline"),

  createTimelineEntry: (data: { emoji?: string; title: string; entryDate?: string }) =>
    request("/timeline", { method: "POST", body: JSON.stringify(data) }),

  getMap: () =>
    request<{ countries: { name: string; moments: number }[] }>("/timeline/map"),

  getExperiences: () =>
    request<{ experiences: { id: string; title: string; description: string; emoji: string }[] }>(
      "/experiences"
    ),

  createExperience: (data: { title: string; description?: string; emoji?: string }) =>
    request("/experiences", { method: "POST", body: JSON.stringify(data) }),

  getConversations: () =>
    request<{ conversations: Conversation[] }>("/messages"),

  getMessages: (conversationId: string) =>
    request<{
      messages: {
        id: string;
        content: string;
        senderId: string;
        senderName: string;
        isOwn: boolean;
        createdAt: string;
      }[];
    }>(`/messages/${conversationId}`),

  sendMessage: (conversationId: string, content: string) =>
    request<{ message: { id: string; content: string; isOwn: boolean; createdAt: string } }>(
      `/messages/${conversationId}`,
      { method: "POST", body: JSON.stringify({ content }) }
    ),

  getNotifications: () =>
    request<{ notifications: Notification[]; unreadCount: number }>("/notifications"),

  markNotificationsRead: () =>
    request("/notifications/read-all", { method: "PATCH" }),

  adminStats: () =>
    request<{ stats: { users: number; moments: number; experiences: number; messages: number } }>(
      "/admin/stats"
    ),

  adminUsers: () => request<{ users: AdminUser[] }>("/admin/users"),

  adminDeleteUser: (id: string) =>
    request<{ success: boolean }>(`/admin/users/${id}`, { method: "DELETE" }),
};

export { ApiError, getToken };
