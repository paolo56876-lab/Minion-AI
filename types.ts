// FIX: Created types.ts to provide shared type definitions.

export type Feature = 'chat' | 'image' | 'analyze';

export interface Message {
  id: string;
  sender: 'user' | 'model';
  text: string;
  image?: string | null; // base64 image url
}