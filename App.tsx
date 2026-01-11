
import React, { useState, useEffect, useCallback } from 'react';
import { View, User, Match, Message } from './types';
import Navbar from './components/Navbar';
import SwipeCard from './components/SwipeCard';
import Login from './components/Login';
import { geminiService } from './services/geminiService';
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
  const [isImprovingBio, setIsImprovingBio] = useState(false);
  const [showMatchAnimation, setShowMatchAnimation] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial Load
  useEffect(() => {
    const init = async () => {
      const savedSession = localStorage.getItem('mnonga_session');
      const savedUserId = localStorage.getItem('mnonga_user_id');
      
      if (savedSession === 'true' && savedUserId) {
        const savedUser = localStorage.getItem('mnonga_user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
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

  const handleLogin = async (userData?: Partial<User>) => {
    setIsLoading(true);
    const user = await api.login(userData?.id || '22600000000');
    setCurrentUser(user);
    localStorage.setItem('mnonga_session', 'true');
    localStorage.setItem('mnonga_user_id', user.id);
    localStorage.setItem('mnonga_user', JSON.stringify(user));
    setIsAuthenticated(true);
    setCurrentView('discover');
    await loadDiscovery(user.id);
    await loadMatches(user.id);
  };

  const handleLogout = () => {
    localStorage.removeItem('mnonga_session');
    localStorage.removeItem('mnonga_user_id');
    setIsAuthenticated(false);
    setCurrentView('login');
  };

  const handleResetApp = () => {
    if (window.confirm("Voulez-vous vraiment réinitialiser toutes les données de l'app ?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleSimulateMatch = () => {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    if (randomUser) {
      setShowMatchAnimation(randomUser);
      const newMatch: Match = {
        id: `sim-match-${Date.now()}`,
        userId: randomUser.id,
        timestamp: Date.now()
      };
      setMatches(prev => [newMatch, ...prev]);
    }
  };

  const handleSwipeLeft = useCallback(async () => {
    if (!currentUser) return;
    const targetUser = users[currentIndex];
    setForcedSwipe(null);
    await api.swipe(currentUser.id, targetUser.id, 'pass');
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex, users, currentUser]);

  const handleSwipeRight = useCallback(async () => {
    if (!currentUser) return;
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
    const msg = await api.sendMessage(selectedMatch.id, currentUser.id, inputText);
    setMessages(prev => ({
      ...prev,
      [selectedMatch.id]: [...(prev[selectedMatch.id] || []), msg],
    }));
    setInputText('');
    setTimeout(async () => {
      const otherUser = users.find(u => u.id === selectedMatch.userId) || { name: 'Membre', bio: '...' };
      const replyText = await geminiService.generateIceBreaker(otherUser.name || 'Ami', (otherUser as User).bio || '');
      const replyMsg = await api.sendMessage(selectedMatch.id, selectedMatch.userId, replyText);
      setMessages(prev => ({
        ...prev,
        [selectedMatch.id]: [...(prev[selectedMatch.id] || []), replyMsg],
      }));
    }, 2000);
  };

  const improveMyBio = async () => {
    if (!currentUser) return;
    setIsImprovingBio(true);
    const improved = await geminiService.improveBio(currentUser.bio, currentUser.interests);
    const updatedUser = { ...currentUser, bio: improved };
    await api.updateProfile(updatedUser);
    setCurrentUser(updatedUser);
    localStorage.setItem('mnonga_user', JSON.stringify(updatedUser));
    setIsImprovingBio(false);
  };

  if (isAuthenticated === null || (isAuthenticated && isLoading && users.length === 0)) {
    return (
      <div className="h-screen w-full flex items-center justify-center rose-gradient">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
            <i className="fa-solid fa-heart text-3xl text-white"></i>
          </div>
          <span className="text-white font-bold text-sm tracking-widest uppercase animate-pulse">Connexion au Faso...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  const renderDiscover = () => {
    if (currentIndex >= users.length) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
            <i className="fa-solid fa-user-slash text-4xl"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Plus de profils</h3>
          <p className="text-gray-500">Reviens plus tard pour voir de nouveaux visages !</p>
          <button onClick={() => loadDiscovery(currentUser!.id)} className="px-6 py-2 bg-red-500 text-white rounded-full font-semibold shadow-lg">Recharger</button>
        </div>
      );
    }
    return (
      <div className="relative h-[calc(100vh-180px)] w-full max-w-md mx-auto px-4 mt-4">
        {currentIndex + 1 < users.length && (
          <div className="absolute inset-0 scale-[0.95] translate-y-2 opacity-60 blur-[1px]">
             <SwipeCard key={users[currentIndex + 1].id} user={users[currentIndex + 1]} isTop={false} onSwipeLeft={() => {}} onSwipeRight={() => {}} />
          </div>
        )}
        <SwipeCard key={users[currentIndex].id} user={users[currentIndex]} isTop={true} forcedDirection={forcedSwipe} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight} />
        <div className="absolute -bottom-14 left-0 right-0 flex justify-center items-center gap-6 pointer-events-none">
          <button onClick={() => setForcedSwipe('left')} className="pointer-events-auto w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-red-500 text-2xl active:scale-90"><i className="fa-solid fa-xmark"></i></button>
          <button className="pointer-events-auto w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-blue-400 text-lg active:scale-90"><i className="fa-solid fa-star"></i></button>
          <button onClick={() => setForcedSwipe('right')} className="pointer-events-auto w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-green-500 text-2xl active:scale-90"><i className="fa-solid fa-heart"></i></button>
        </div>
      </div>
    );
  };

  const renderMatches = () => (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Nouveaux Matchs</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {matches.map(match => {
          const user = [...users].find(u => u.id === match.userId) || { name: 'Membre', photos: ['https://picsum.photos/200'] };
          return (
            <div key={match.id} className="flex-shrink-0 flex flex-col items-center gap-1">
              <div onClick={() => { setSelectedMatch(match); setCurrentView('chat'); }} className="w-16 h-16 rounded-full border-2 border-red-500 p-0.5 cursor-pointer shadow-md">
                <img src={user.photos[0]} alt={(user as any).name} className="w-full h-full object-cover rounded-full" />
              </div>
              <span className="text-xs font-semibold text-gray-600">{(user as any).name}</span>
            </div>
          );
        })}
        {matches.length === 0 && <p className="text-gray-400 text-sm italic py-4">Fais ton premier match !</p>}
      </div>
      <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Messages</h2>
      <div className="space-y-4">
        {matches.map(match => {
          const user = [...users].find(u => u.id === match.userId) || { name: 'Membre', photos: ['https://picsum.photos/200'] };
          const matchMsgs = messages[match.id] || [];
          const lastMsg = matchMsgs.length > 0 ? matchMsgs[matchMsgs.length - 1].text : 'Démarre la conversation !';
          return (
            <div key={match.id} onClick={() => { setSelectedMatch(match); setCurrentView('chat'); }} className="flex items-center gap-4 p-2 active:bg-gray-100 rounded-2xl cursor-pointer">
              <img src={user.photos[0]} alt={(user as any).name} className="w-16 h-16 rounded-full object-cover shadow-sm" />
              <div className="flex-1 border-b border-gray-50 pb-2">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-gray-800">{(user as any).name}</h4>
                  <span className="text-[10px] text-gray-400">En ligne</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-1">{lastMsg}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderChat = () => {
    if (!selectedMatch || !currentUser) return null;
    const otherUser = [...users].find(u => u.id === selectedMatch.userId) || { name: 'Membre', photos: ['https://picsum.photos/200'] };
    return (
      <div className="flex flex-col h-[calc(100vh-64px)]">
        <header className="flex items-center gap-3 p-4 border-b border-gray-50 bg-white">
          <button onClick={() => setCurrentView('matches')} className="text-gray-500 p-2"><i className="fa-solid fa-chevron-left"></i></button>
          <img src={otherUser.photos[0]} alt={(otherUser as any).name} className="w-10 h-10 rounded-full object-cover" />
          <div className="flex-1">
            <h4 className="font-bold text-gray-800 text-sm">{(otherUser as any).name}</h4>
            <span className="text-[10px] text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> En ligne</span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {(messages[selectedMatch.id] || []).map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${msg.senderId === currentUser.id ? 'bg-red-500 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>{msg.text}</div>
            </div>
          ))}
        </div>
        <footer className="p-4 bg-white border-t border-gray-100">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
            <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Écris ton message..." className="flex-1 bg-transparent outline-none text-sm py-1" />
            <button onClick={handleSendMessage} className="text-red-500 p-2"><i className="fa-solid fa-paper-plane text-lg"></i></button>
          </div>
        </footer>
      </div>
    );
  };

  const renderProfile = () => {
    if (!currentUser) return null;
    return (
      <div className="pb-24">
        <div className="relative">
          <div className="w-full h-96">
            <img src={currentUser.photos[0]} alt="Moi" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        </div>
        <div className="p-6 space-y-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{currentUser.name}, {currentUser.age}</h2>
            <p className="text-gray-600 text-sm font-medium mt-1">{currentUser.occupation} • {currentUser.district}</p>
          </div>
          <div className="bg-red-50/50 rounded-3xl p-5 border border-red-100/50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-red-900 text-xs uppercase tracking-widest">Ma Bio</h3>
              <button onClick={improveMyBio} disabled={isImprovingBio} className="text-[10px] bg-red-500 text-white px-3 py-1.5 rounded-full font-bold">{isImprovingBio ? '...' : 'Optimiser par IA'}</button>
            </div>
            <p className="text-gray-800 text-[15px] leading-relaxed italic">"{currentUser.bio}"</p>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-bold text-gray-400 text-[10px] uppercase tracking-widest">Zone de Test (Développeur)</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleSimulateMatch} className="py-3 bg-green-100 text-green-700 rounded-xl font-bold text-xs uppercase border border-green-200">Simuler Match</button>
              <button onClick={handleResetApp} className="py-3 bg-orange-100 text-orange-700 rounded-xl font-bold text-xs uppercase border border-orange-200">Vider Cache</button>
            </div>
          </div>

          <button onClick={handleLogout} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] mt-8 shadow-xl active:scale-95 transition-transform">Se déconnecter</button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-white relative flex flex-col overflow-hidden shadow-2xl border-x border-gray-100">
      {currentView !== 'chat' && (
        <header className="flex items-center justify-between px-6 py-5 bg-white z-40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-[#e94057] to-[#f27121] rounded-xl flex items-center justify-center text-white shadow-lg rotate-3"><i className="fa-solid fa-heart text-sm"></i></div>
            <h1 className="text-2xl font-black tracking-tighter text-gray-900">M'NONGA</h1>
          </div>
        </header>
      )}
      <main className="flex-1 overflow-y-auto">
        {currentView === 'discover' && renderDiscover()}
        {currentView === 'matches' && renderMatches()}
        {currentView === 'chat' && renderChat()}
        {currentView === 'profile' && renderProfile()}
      </main>
      {currentView !== 'chat' && <Navbar currentView={currentView} onViewChange={setCurrentView} hasNewMatch={matches.length > 0} />}
      {showMatchAnimation && currentUser && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <h2 className="text-6xl font-black text-white italic tracking-tighter mb-4 z-10 animate-bounce">Match !</h2>
          <p className="text-green-400 font-black mb-12 z-10 uppercase tracking-[0.3em] text-sm">C'est le Wakat !</p>
          <div className="flex items-center gap-6 mb-16 z-10 relative">
            <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.3)]"><img src={currentUser.photos[0]} className="w-full h-full object-cover" /></div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#e94057] rounded-full flex items-center justify-center shadow-xl z-20"><i className="fa-solid fa-heart text-2xl text-white"></i></div>
            <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.3)]"><img src={showMatchAnimation.photos[0]} className="w-full h-full object-cover" /></div>
          </div>
          <button onClick={() => { setShowMatchAnimation(null); setCurrentView('matches'); }} className="w-full py-5 bg-white text-gray-900 rounded-full font-black uppercase tracking-widest active:scale-95 shadow-2xl">Voir mes matchs</button>
        </div>
      )}
    </div>
  );
};

export default App;
