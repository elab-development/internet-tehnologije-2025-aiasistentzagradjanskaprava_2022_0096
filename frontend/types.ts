
export type UserRole = 'admin' | 'citizen';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

export interface Folder {
  id: number;
  name: string;
  created_at: string;
  user: number;
}

export interface Chat {
  id: number;
  name: string;
  folder: number;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  question: string;
  answer: string;
  timestamp: string;
  chat: number;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}
