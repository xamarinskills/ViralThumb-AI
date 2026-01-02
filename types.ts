
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  credits: number;
  plan: 'free' | 'creator' | 'pro';
  role: 'user' | 'admin';
  is_deleted?: boolean;
  deleted_at?: string;
}

export interface Thumbnail {
  id: string;
  url: string;
  prompt: string;
  style: string;
  createdAt: string;
  ctr?: string;
  status: 'completed' | 'generating' | 'failed';
}

export interface Template {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  isPremium: boolean;
  badge?: string;
}
