
import React from 'react';
import { View } from '../types';

interface NavbarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  hasNewMatch?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange, hasNewMatch }) => {
  const tabs: { id: View; icon: string; label: string }[] = [
    { id: 'discover', icon: 'fa-fire', label: 'Découvrir' },
    { id: 'matches', icon: 'fa-message', label: 'Messages' },
    { id: 'profile', icon: 'fa-user', label: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 flex justify-around items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`flex flex-col items-center gap-1 transition-colors duration-200 p-2 relative ${
            currentView === tab.id ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          <i className={`fa-solid ${tab.icon} text-xl`}></i>
          <span className="text-[10px] font-medium uppercase tracking-wide">{tab.label}</span>
          
          {tab.id === 'matches' && hasNewMatch && (
            <span className="absolute top-1 right-2 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></span>
          )}
          
          {currentView === tab.id && (
            <div className="absolute -bottom-2 w-1 h-1 bg-red-500 rounded-full"></div>
          )}
        </button>
      ))}
    </nav>
  );
};

export default Navbar;
