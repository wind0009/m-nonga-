
import { User, Match, Message, Gender } from '../types';
import { MOCK_USERS } from '../constants';

// Simulating a database in localStorage
const DB_KEYS = {
  USERS: 'mnonga_db_users',
  MATCHES: 'mnonga_db_matches',
  MESSAGES: 'mnonga_db_messages',
  SWIPES: 'mnonga_db_swipes', // { fromId: { toId: 'like' | 'pass' } }
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  },
  set: (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export const api = {
  // --- AUTH ---
  async login(phone: string): Promise<User> {
    await delay(1000);
    const users = storage.get<User[]>(DB_KEYS.USERS, []);
    let user = users.find(u => u.id === `user_${phone}`);
    
    if (!user) {
      user = {
        id: `user_${phone}`,
        name: 'Nouveau Membre',
        age: 25,
        city: 'Ouagadougou',
        district: 'Centre',
        occupation: 'Membre M\'nonga',
        bio: 'Je viens de rejoindre M\'nonga !',
        interests: ['Rencontres', 'Culture'],
        photos: ['https://picsum.photos/id/1012/600/800'],
        gender: Gender.OTHER
      };
      users.push(user);
      storage.set(DB_KEYS.USERS, users);
    }
    return user;
  },

  // --- DISCOVERY ---
  async getDiscoverableUsers(currentUserId: string): Promise<User[]> {
    await delay(800);
    const swipes = storage.get<Record<string, Record<string, string>>>(DB_KEYS.SWIPES, {});
    const userSwipes = swipes[currentUserId] || {};
    
    // Return mock users + DB users that haven't been swiped yet
    const allUsers = [...MOCK_USERS]; 
    return allUsers.filter(u => u.id !== currentUserId && !userSwipes[u.id]);
  },

  // --- SWIPING & MATCHING ---
  async swipe(fromId: string, toId: string, direction: 'like' | 'pass'): Promise<Match | null> {
    await delay(200);
    const swipes = storage.get<Record<string, Record<string, string>>>(DB_KEYS.SWIPES, {});
    
    if (!swipes[fromId]) swipes[fromId] = {};
    swipes[fromId][toId] = direction;
    storage.set(DB_KEYS.SWIPES, swipes);

    if (direction === 'like') {
      // Check for mutual like
      const targetSwipes = swipes[toId] || {};
      if (targetSwipes[fromId] === 'like' || toId.length < 5) { // Simulating auto-like from mock users
        const matches = storage.get<Match[]>(DB_KEYS.MATCHES, []);
        const matchId = `match_${Date.now()}`;
        const newMatch: Match = {
          id: matchId,
          userId: toId,
          timestamp: Date.now()
        };
        matches.push(newMatch);
        storage.set(DB_KEYS.MATCHES, matches);
        return newMatch;
      }
    }
    return null;
  },

  // --- MESSAGES ---
  async getMatches(currentUserId: string): Promise<Match[]> {
    await delay(500);
    return storage.get<Match[]>(DB_KEYS.MATCHES, []);
  },

  async getMessages(matchId: string): Promise<Message[]> {
    const allMessages = storage.get<Record<string, Message[]>>(DB_KEYS.MESSAGES, {});
    return allMessages[matchId] || [];
  },

  async sendMessage(matchId: string, senderId: string, text: string): Promise<Message> {
    await delay(100);
    const allMessages = storage.get<Record<string, Message[]>>(DB_KEYS.MESSAGES, {});
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      senderId,
      text,
      timestamp: Date.now()
    };
    
    if (!allMessages[matchId]) allMessages[matchId] = [];
    allMessages[matchId].push(newMessage);
    storage.set(DB_KEYS.MESSAGES, allMessages);
    return newMessage;
  },

  async updateProfile(user: User): Promise<void> {
    await delay(500);
    const users = storage.get<User[]>(DB_KEYS.USERS, []);
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
    } else {
      users.push(user);
    }
    storage.set(DB_KEYS.USERS, users);
  }
};
