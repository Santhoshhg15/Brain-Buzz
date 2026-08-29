import { create } from "zustand";
import { authFetch } from "../auth/apiClient";

export interface QuizDetail {
  id: string;
  title: string;
  createdAt: string;
  questions: QuestionDetail[];
}

export interface QuestionDetail {
  id: string;
  quizId: string;
  text: string;
  orderIndex: number;
  durationSeconds: number;
  points: number;
  options: OptionDetail[];
}

export interface OptionDetail {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface AdminStore {
  quizzes: any[];
  currentQuiz: QuizDetail | null;
  loading: boolean;
  formError: string | null;

  // Actions
  fetchQuizzes: () => Promise<void>;
  fetchQuizDetail: (quizId: string) => Promise<void>;
  createQuiz: (title: string) => Promise<string | null>;
  updateQuizTitle: (quizId: string, title: string) => Promise<void>;
  deleteQuiz: (quizId: string) => Promise<boolean>;
  addQuestion: (quizId: string, questionData: any) => Promise<void>;
  bulkImportQuestions: (quizId: string, questions: any[]) => Promise<{ success: boolean; count?: number; error?: string; details?: any[] }>;
  updateQuestion: (questionId: string, updates: any) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
  updateOption: (optionId: string, updates: any) => Promise<void>;
  clearFormError: () => void;
}

const API_BASE = (import.meta.env.VITE_SERVER_URL || "http://localhost:4000") + "/api";

export const useAdminStore = create<AdminStore>((set, get) => ({
  quizzes: [],
  currentQuiz: null,
  loading: false,
  formError: null,

  clearFormError: () => set({ formError: null }),

  fetchQuizzes: async () => {
    set({ loading: true, formError: null });
    try {
      const res = await authFetch(`${API_BASE}/quizzes`);
      if (!res.ok) throw new Error("Failed to fetch quizzes");
      const data = await res.json();
      set({ quizzes: data, loading: false });
    } catch (e: any) {
      set({ formError: e.message, loading: false });
    }
  },

  fetchQuizDetail: async (quizId) => {
    set({ loading: true, formError: null });
    try {
      const res = await authFetch(`${API_BASE}/quizzes/${quizId}`);
      if (!res.ok) throw new Error("Failed to fetch quiz details");
      const data = await res.json();
      set({ currentQuiz: data, loading: false });
    } catch (e: any) {
      set({ formError: e.message, loading: false });
    }
  },

  createQuiz: async (title) => {
    set({ loading: true, formError: null });
    try {
      const res = await authFetch(`${API_BASE}/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create quiz");
      await get().fetchQuizzes();
      set({ loading: false });
      return data.id;
    } catch (e: any) {
      set({ formError: e.message, loading: false });
      return null;
    }
  },

  updateQuizTitle: async (quizId, title) => {
    set({ loading: true, formError: null });
    try {
      const res = await authFetch(`${API_BASE}/quizzes/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update quiz title");
      await get().fetchQuizDetail(quizId);
      set({ loading: false });
    } catch (e: any) {
      set({ formError: e.message, loading: false });
    }
  },

  deleteQuiz: async (quizId) => {
    set({ loading: true, formError: null });
    try {
      const res = await authFetch(`${API_BASE}/quizzes/${quizId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete quiz");
      await get().fetchQuizzes();
      set({ loading: false });
      return true;
    } catch (e: any) {
      set({ formError: e.message, loading: false });
      return false;
    }
  },

  addQuestion: async (quizId, questionData) => {
    set({ loading: true, formError: null });
    try {
      const res = await authFetch(`${API_BASE}/quizzes/${quizId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add question");
      await get().fetchQuizDetail(quizId);
      set({ loading: false });
    } catch (e: any) {
      set({ formError: e.message, loading: false });
      throw e; // Rethrow to handle locally in the component if needed
    }
  },

  bulkImportQuestions: async (quizId, questions) => {
    set({ loading: true, formError: null });
    try {
      const res = await authFetch(`${API_BASE}/quizzes/${quizId}/questions/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        set({ loading: false });
        if (res.status === 400 && data.details) {
          // Structured validation error
          return { success: false, error: data.error, details: data.details };
        }
        return { success: false, error: data.error || "Failed to import questions" };
      }
      
      await get().fetchQuizDetail(quizId);
      set({ loading: false });
      return { success: true, count: data.created };
    } catch (e: any) {
      set({ loading: false });
      return { success: false, error: e.message || "Network error" };
    }
  },

  updateQuestion: async (questionId, updates) => {
    set({ loading: true, formError: null });
    try {
      const res = await authFetch(`${API_BASE}/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update question");
      
      const currentQuiz = get().currentQuiz;
      if (currentQuiz) {
        await get().fetchQuizDetail(currentQuiz.id);
      }
      set({ loading: false });
    } catch (e: any) {
      set({ formError: e.message, loading: false });
    }
  },

  deleteQuestion: async (questionId) => {
    set({ loading: true, formError: null });
    try {
      const res = await authFetch(`${API_BASE}/questions/${questionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete question");
      
      const currentQuiz = get().currentQuiz;
      if (currentQuiz) {
        await get().fetchQuizDetail(currentQuiz.id);
      }
      set({ loading: false });
    } catch (e: any) {
      set({ formError: e.message, loading: false });
    }
  },

  updateOption: async (optionId, updates) => {
    set({ loading: true, formError: null });
    try {
      const res = await authFetch(`${API_BASE}/options/${optionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update option");
      
      const currentQuiz = get().currentQuiz;
      if (currentQuiz) {
        await get().fetchQuizDetail(currentQuiz.id);
      }
      set({ loading: false });
    } catch (e: any) {
      set({ formError: e.message, loading: false });
    }
  },
}));
