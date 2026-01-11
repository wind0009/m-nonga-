
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  async improveBio(currentBio: string, interests: string[]): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Améliore cette bio Tinder pour une application au Burkina Faso nommée M'nonga. 
        Bio actuelle: "${currentBio}". 
        Intérêts: ${interests.join(', ')}. 
        Rends-la charmante, moderne, et ajoute une touche de culture burkinabè (utilisant des mots comme 'barké', 'Wakat', 'Faso', etc., si approprié). Garde-la courte.`,
      });
      return response.text?.trim() || currentBio;
    } catch (error) {
      console.error("Gemini Error:", error);
      return currentBio;
    }
  },

  async generateIceBreaker(otherUserName: string, otherUserBio: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Génère un message d'approche (ice-breaker) drôle et respectueux pour ${otherUserName} sur l'app M'nonga. 
        Sa bio est: "${otherUserBio}". 
        Le ton doit être burkinabè (un peu de "parenté à plaisanterie" ou humour local gentil).`,
      });
      return response.text?.trim() || "Salut ! Ravi de te rencontrer.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Salut ! Comment vas-tu ?";
    }
  }
};
