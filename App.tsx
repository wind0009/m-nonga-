
import React, { useState, useEffect, useCallback } from 'react';
import { View, User, Match, Message } from './types';
import Navbar from './components/Navbar';
import SwipeCard from './components/SwipeCard';
import Login from './components/Login';
import { api } from './services/api';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentView, setCurrentView] = useState<View>('discover');
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [inputText, setInputText] = useState('');
  const [forcedSwipe, setForcedSwipe] = useState<'left' | 'right' | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showMatchAnimation, setShowMatchAnimation] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    const init = async () => {
      const savedUserId = localStorage.getItem('mnonga_user_id');
      if (savedUserId) {
        // Nettoyage de l'ID pour la recherche
        const cleanId = savedUserId.startsWith('user_') ? savedUserId.slice(5) : savedUserId;
        const user = await api.getUser(cleanId);
        if (user) {
          setCurrentUser(user);
          setIsAuthenticated(true);
          await loadDiscovery(user.id);
          await loadMatches(user.id);
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const loadDiscovery = async (userId: string) => {
    setIsLoading(true);
    const discoverable = await api.getDiscoverableUsers(userId);
    setUsers(discoverable);
    setCurrentIndex(0);
    setIsLoading(false);
  };

  const loadMatches = async (userId: string) => {
    const m = await api.getMatches(userId);
    setMatches(m);
    for (const match of m) {
      const msgs = await api.getMessages(match.id);
      setMessages(prev => ({ ...prev, [match.id]: msgs }));
    }
  };

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('mnonga_user_id', user.id);
    setIsAuthenticated(true);
    setCurrentView('discover');
    await loadDiscovery(user.id);
    await loadMatches(user.id);
  };

  const handleLogout = () => {
    localStorage.removeItem('mnonga_user_id');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('login');
  };

  const handleSwipeLeft = useCallback(async () => {
    if (!currentUser || currentIndex >= users.length) return;
    const targetUser = users[currentIndex];
    setForcedSwipe(null);
    await api.swipe(currentUser.id, targetUser.id, 'pass');
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex, users, currentUser]);

  const handleSwipeRight = useCallback(async () => {
    if (!currentUser || currentIndex >= users.length) return;
    const swipedUser = users[currentIndex];
    setForcedSwipe(null);
    const match = await api.swipe(currentUser.id, swipedUser.id, 'like');
    if (match) {
      setMatches(prev => [match, ...prev]);
      setShowMatchAnimation(swipedUser);
    }
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex, users, currentUser]);

  const handleSendMessage = async () => {
    if (!selectedMatch || !inputText.trim() || !currentUser) return;
    const text = inputText;
    setInputText('');
    const msg = await api.sendMessage(selectedMatch.id, currentUser.id, text);
    setMessages(prev => ({
      ...prev,
      [selectedMatch.id]: [...(prev[selectedMatch.id] || []), msg],
    }));
  };

  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-full flex items-center justify-center rose-gradient">
        <i className="fa-solid fa-heart text-white text-5xl animate-bounce"></i>
      </div>
    );
  }

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="max-w-md mx-auto h-screen bg-white relative flex flex-col overflow-hidden shadow-2xl border-x border-gray-100">
      {currentView !== 'chat' && (
        <header className="flex items-center justify-between px-6 py-5 bg-white z-40 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rose-gradient rounded-xl flex items-center justify-center text-white shadow-lg rotate-3"><i className="fa-solid fa-heart text-sm"></i></div>
            <h1 className="text-2xl font-black tracking-tighter text-gray-900 uppercase">M'NONGA</h1>
          </div>
          <button onClick={() => setShowFeedbackModal(true)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
            <i className="fa-solid fa-comment-dots text-sm"></i>
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto relative bg-gray-50/50">
        {currentView === 'discover' && (
          isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
               <i className="fa-solid fa-circle-notch animate-spin text-3xl mb-2"></i>
               <span className="text-[10px] font-bold uppercase tracking-widest">Recherche en cours...</span>
            </div>
          ) : currentIndex >= users.length ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-red-100 shadow-sm border border-gray-100">
                <i className="fa-solid fa-face-sad-tear text-3xl"></i>
              </div>
              <h3 className="text-lg font-bold">Plus personne à proximité</h3>
              <p className="text-xs text-gray-400 px-8">Nous avons épuisé les profils de ton secteur. Reviens demain !</p>
              <button onClick={() => loadDiscovery(currentUser!.id)} className="px-10 py-4 bg-red-500 text-white rounded-full font-black shadow-lg text-xs uppercase tracking-widest active:scale-95 transition-transform">RECHARGER</button>
            </div>
          ) : (
            <div className="relative h-[calc(100vh-200px)] w-full px-4 mt-4">
              <SwipeCard key={users[currentIndex].id} user={users[currentIndex]} isTop={true} forcedDirection={forcedSwipe} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight} />
              <div className="absolute -bottom-14 left-0 right-0 flex justify-center items-center gap-6">
                <button onClick={() => setForcedSwipe('left')} className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-red-500 text-2xl active:scale-90 border border-red-50"><i className="fa-solid fa-xmark"></i></button>
                <button onClick={() => setForcedSwipe('right')} className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-green-500 text-2xl active:scale-90 border border-green-50"><i className="fa-solid fa-heart"></i></button>
              </div>
            </div>
          )
        )}

        {currentView === 'matches' && (
          <div className="p-4 space-y-6 animate-in slide-in-from-bottom duration-300">
            <h2 className="text-2xl font-black px-2 tracking-tight italic">Nouveaux Matchs</h2>
            <div className="grid grid-cols-3 gap-4">
              {matches.map(m => {
                const u = users.find(user => user.id === m.userId) || { photos: ['https://picsum.photos/200'], name: 'Utilisateur' };
                return (
                  <div key={m.id} onClick={() => { setSelectedMatch(m); setCurrentView('chat'); }} className="flex flex-col items-center gap-2 cursor-pointer group">
                    <div className="relative">
                       <img src={u.photos[0]} className="w-24 h-24 rounded-[2rem] object-cover shadow-lg border-2 border-white group-hover:border-red-500 transition-colors" />
                       <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full"></div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-900">{(u as any).name}</span>
                  </div>
                );
              })}
              {matches.length === 0 && (
                <div className="col-span-3 text-center py-20 text-gray-400 text-xs font-bold uppercase tracking-widest opacity-50">
                   Pas encore de match...
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'chat' && selectedMatch && (
           <div className="flex flex-col h-full bg-white">
             <header className="p-4 bg-white border-b flex items-center gap-3">
               <button onClick={() => setCurrentView('matches')} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50"><i className="fa-solid fa-chevron-left text-gray-400"></i></button>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 overflow-hidden shadow-sm">
                    <img src={users.find(u => u.id === selectedMatch.userId)?.photos[0]} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-gray-900">{users.find(u => u.id === selectedMatch.userId)?.name || 'Match'}</h3>
                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">En ligne</p>
                  </div>
               </div>
             </header>
             <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50/50 scrollbar-hide">
               {(messages[selectedMatch.id] || []).map(m => (
                 <div key={m.id} className={`flex ${m.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                   <div className={`px-4 py-3 rounded-[20px] text-sm max-w-[80%] font-medium shadow-sm ${m.senderId === currentUser?.id ? 'bg-red-500 text-white rounded-tr-none' : 'bg-white border text-gray-700 rounded-tl-none'}`}>
                     {m.text}
                   </div>
                 </div>
               ))}
             </div>
             <div className="p-4 bg-white border-t flex gap-3">
               <input value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-red-100 transition-all" placeholder="Écris ici ton message..." />
               <button onClick={handleSendMessage} className="w-12 h-12 rose-gradient text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-transform"><i className="fa-solid fa-paper-plane"></i></button>
             </div>
           </div>
        )}

        {currentView === 'profile' && currentUser && (
          <div className="p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-36 h-36 rounded-[3rem] overflow-hidden shadow-2xl rotate-3 mb-6 border-4 border-white">
                  <img src={currentUser.photos[0]} className="w-full h-full object-cover" />
                </div>
                <button className="absolute bottom-4 -right-2 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-red-500"><i className="fa-solid fa-camera"></i></button>
              </div>
              <h2 className="text-3xl font-black text-gray-900">{currentUser.name}, {currentUser.age}</h2>
              <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
                <i className="fa-solid fa-location-dot text-red-500"></i>
                <span>{currentUser.district}, {currentUser.city}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm">
                <h4 className="text-[10px] font-black uppercase text-red-500 mb-3 tracking-widest">Ma Bio Faso</h4>
                <p className="text-sm font-medium text-gray-600 leading-relaxed italic">"{currentUser.bio}"</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {currentUser.interests.map(i => (
                  <span key={i} className="px-4 py-2 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 border border-white">{i}</span>
                ))}
              </div>
              
              <button onClick={handleLogout} className="w-full py-5 bg-gray-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-transform mt-6">Déconnexion</button>
            </div>
          </div>
        )}
      </main>

      {currentView !== 'chat' && <Navbar currentView={currentView} onViewChange={setCurrentView} hasNewMatch={matches.length > 0} />}

      {/* Modal de Feedback */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <h3 className="text-2xl font-black mb-2 italic">Barké ! 🇧🇫</h3>
            <p className="text-xs text-gray-400 mb-6 font-medium">Une idée pour améliorer M'nonga ? Dis-le nous franchement.</p>
            <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} className="w-full h-32 bg-gray-50 border border-gray-100 rounded-3xl p-5 text-sm outline-none focus:ring-2 focus:ring-red-100 transition-all font-medium" placeholder="Ex: Ajoutez plus de quartiers de Ouaga..." />
            <div className="flex gap-4 mt-6">
              <button onClick={() => setShowFeedbackModal(false)} className="flex-1 py-4 font-black text-gray-400 text-[10px] uppercase tracking-widest">Fermer</button>
              <button onClick={() => { setShowFeedbackModal(false); setFeedbackText(''); }} className="flex-[2] py-4 rose-gradient text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-transform">Envoyer</button>
            </div>
          </div>
        </div>
      )}

      {showMatchAnimation && currentUser && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-700">
          <div className="absolute inset-0 opacity-40">
             <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-500 rounded-full blur-[100px]"></div>
             <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-orange-500 rounded-full blur-[100px]"></div>
          </div>
          <h2 className="text-6xl font-black text-white italic mb-12 animate-bounce relative z-10">Match !</h2>
          <div className="flex items-center gap-6 mb-16 relative z-10">
            <div className="relative">
              <img src={currentUser.photos[0]} className="w-28 h-28 rounded-full border-4 border-white shadow-2xl rotate-[-10deg]" />
              <div className="absolute -top-2 -left-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">Moi</div>
            </div>
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-red-500 text-3xl animate-pulse shadow-2xl"><i className="fa-solid fa-heart"></i></div>
            <div className="relative">
              <img src={showMatchAnimation.photos[0]} className="w-28 h-28 rounded-full border-4 border-white shadow-2xl rotate-[10deg]" />
              <div className="absolute -top-2 -right-2 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg italic">Lui</div>
            </div>
          </div>
          <button onClick={() => { setShowMatchAnimation(null); setCurrentView('matches'); }} className="w-full py-5 bg-white text-gray-900 rounded-full font-black uppercase text-xs tracking-[0.3em] shadow-2xl relative z-10 active:scale-95 transition-transform">Envoyer un message</button>
          <button onClick={() => setShowMatchAnimation(null)} className="mt-8 text-white/50 font-black uppercase text-[10px] tracking-[0.4em] relative z-10 hover:text-white transition-colors">Continuer à swiper</button>
        </div>
      )}
    </div>
  );
};

export default App;
