export enum MessageRole {
  USER = 'user',
  MODEL = 'model'
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  imageUrl?: string;
  timestamp: number;
}

export interface Era {
  id: string;
  name: string;
  yearRange: string;
  description: string;
  color: string;
  musicType: 'ancient' | 'war' | 'peace' | 'modern';
}

export interface AudioState {
  isPlaying: boolean;
  volume: number;
  type: 'ancient' | 'war' | 'peace' | 'modern';
}