export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Provider {
  name: string;
  configured: boolean;
  model: string;
}