
import { User, Match, Message, Gender } from '../types';
import { MOCK_USERS } from '../constants';
import { supabase } from './supabaseClient';

export const api = {
  // Vérifie si un utilisateur existe
  async getUser(phone: string): Promise<User | null> {
    const userId = `user_${phone}`;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("Détails Erreur getUser:", JSON.stringify(error, null, 2));
        throw error;
      }
      return data as User | null;
    } catch (e: any) {
      console.error("Erreur getUser (lisible):", e.message || JSON.stringify(e));
      return null;
    }
  },

  // Crée ou met à jour un profil complet
  async saveProfile(user: User): Promise<void> {
    try {
      const profileData = {
        id: user.id,
        name: user.name,
        age: user.age,
        city: user.city,
        district: user.district,
        occupation: user.occupation,
        bio: user.bio,
        interests: user.interests,
        photos: user.photos,
        gender: user.gender
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });
      
      if (error) {
        console.error("Erreur de Schéma Supabase détectée !");
        console.error("Message:", error.message);
        
        if (error.code === 'PGRST204' || error.message.includes('column')) {
          console.group("🆘 BESOIN DE CORRECTION SQL");
          console.log("Exécutez ceci dans votre SQL Editor Supabase :");
          console.log(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INTEGER, ADD COLUMN IF NOT EXISTS city TEXT, ADD COLUMN IF NOT EXISTS district TEXT, ADD COLUMN IF NOT EXISTS occupation TEXT, ADD COLUMN IF NOT EXISTS bio TEXT, ADD COLUMN IF NOT EXISTS gender TEXT, ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}', ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';`);
          console.groupEnd();
        }
        throw error;
      }
    } catch (e: any) {
      console.error("Erreur critique saveProfile:", e.message || JSON.stringify(e));
      throw e;
    }
  },

  async login(phone: string): Promise<User> {
    const existing = await this.getUser(phone);
    if (existing) return existing;
    
    const userId = `user_${phone}`;
    const newUser: User = {
      id: userId,
      name: `Membre ${phone.slice(-4)}`,
      age: 18,
      city: 'Ouagadougou',
      district: 'Centre',
      occupation: 'Nouveau',
      bio: 'Salut !',
      interests: [],
      photos: [`https://picsum.photos/id/${Math.floor(Math.random()*100)}/600/800`],
      gender: Gender.OTHER
    };
    await this.saveProfile(newUser);
    return newUser;
  },

  async getDiscoverableUsers(currentUserId: string): Promise<User[]> {
    try {
      const { data: swipes, error: swipeError } = await supabase
        .from('swipes')
        .select('to_id')
        .eq('from_id', currentUserId);
      
      if (swipeError) console.warn("Erreur swipes:", swipeError.message);
      
      const swipedIds = swipes?.map(s => s.to_id) || [];
      
      let query = supabase.from('profiles').select('*').neq('id', currentUserId);
      
      if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`);
      }

      const { data: profiles, error: profileError } = await query.limit(20);
      
      if (profileError || !profiles || profiles.length === 0) {
        return MOCK_USERS.filter(u => u.id !== currentUserId && !swipedIds.includes(u.id));
      }

      return profiles as User[];
    } catch (e: any) {
      return MOCK_USERS;
    }
  },

  async swipe(fromId: string, toId: string, direction: 'like' | 'pass'): Promise<Match | null> {
    try {
      await supabase.from('swipes').insert([{ from_id: fromId, to_id: toId, direction }]);
      if (direction === 'like') {
        const { data: counter } = await supabase.from('swipes').select('*').eq('from_id', toId).eq('to_id', fromId).eq('direction', 'like').maybeSingle();
        if (counter) {
          const { data: match, error: matchError } = await supabase.from('matches').insert([{ user1_id: fromId, user2_id: toId }]).select().single();
          if (match) return { id: match.id, userId: toId, timestamp: Date.parse(match.created_at) };
        }
      }
    } catch (e: any) {}
    return null;
  },

  async getMatches(currentUserId: string): Promise<Match[]> {
    try {
      const { data, error } = await supabase.from('matches').select('*').or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);
      if (error) return [];
      return data.map(m => ({
        id: m.id,
        userId: m.user1_id === currentUserId ? m.user2_id : m.user1_id,
        timestamp: Date.parse(m.created_at)
      }));
    } catch (e: any) {
      return [];
    }
  },

  async getMessages(matchId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase.from('messages').select('*').eq('match_id', matchId).order('created_at', { ascending: true });
      if (error) return [];
      return data.map(msg => ({ id: msg.id, senderId: msg.sender_id, text: msg.text, timestamp: Date.parse(msg.created_at) }));
    } catch (e: any) {
      return [];
    }
  },

  async sendMessage(matchId: string, senderId: string, text: string): Promise<Message> {
    const { data, error } = await supabase.from('messages').insert([{ match_id: matchId, sender_id: senderId, text: text }]).select().single();
    if (error) throw error;
    return { id: data.id, senderId: data.sender_id, text: data.text, timestamp: Date.parse(data.created_at) };
  }
};
