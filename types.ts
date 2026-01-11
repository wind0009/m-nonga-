
export enum Gender {
  MALE = 'Homme',
  FEMALE = 'Femme',
  OTHER = 'Autre'
}

export interface User {
  id: string;
  name: string;
  age: number;
  city: string;
  district: string;
  occupation: string;
  bio: string;
  interests: string[];
  photos: string[];
  gender: Gender;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface Match {
  id: string;
  userId: string;
  lastMessage?: string;
  timestamp: number;
}

export type View = 'login' | 'discover' | 'matches' | 'chat' | 'profile';
