import { create } from "zustand";
import { User } from "@/lib/types";

/**
 * User store state interface
 */
interface UserState {
  currentUser: User | null;
  isLoading: boolean;
}

/**
 * User store actions interface
 */
interface UserActions {
  setUser: (user: User | null) => void;
  logout: () => void;
  clearUser: () => void;  // ← 添加这一行
  fetchUser: () => Promise<void>;
}

/**
 * User store - manages current user session
 * Fetches real user data from API on demand
 */
export const useUserStore = create<UserState & UserActions>((set) => ({
  // Initial state - no user until fetched
  currentUser: null,
  isLoading: false,

  // Actions
  setUser: (user) => set({ currentUser: user }),
  
  // 退出登录（两种叫法，功能相同）
  logout: () => set({ currentUser: null }),
  clearUser: () => set({ currentUser: null }),  // ← 添加这一行
  
  // Fetch current user from API
  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        // Map API response to User type
        const user: User = {
          id: data.user.userId,
          name: data.user.name,
          role: data.user.role === "TEACHER" ? "teacher" : "student",
        };
        set({ currentUser: user, isLoading: false });
      } else {
        // Not authenticated or error
        set({ currentUser: null, isLoading: false });
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      set({ currentUser: null, isLoading: false });
    }
  },
}));
