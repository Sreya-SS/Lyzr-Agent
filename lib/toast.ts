// Tiny toast store — mirrors the reference's XP/completion toast.
"use client";

import { create } from "zustand";

interface ToastState {
  message: string | null;
  show: (message: string) => void;
  clear: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    set({ message });
    // Auto-dismiss, matching the reference's ~1.7s.
    setTimeout(() => set({ message: null }), 1900);
  },
  clear: () => set({ message: null }),
}));
