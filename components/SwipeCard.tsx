
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';

interface SwipeCardProps {
  user: User;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
  forcedDirection?: 'left' | 'right' | null;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ user, onSwipeLeft, onSwipeRight, isTop, forcedDirection }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFlyingOut, setIsFlyingOut] = useState(false);
  const [exitDirection, setExitDirection] = useState<number>(0);
  
  const dragStart = useRef({ x: 0, y: 0 });
  const threshold = 120;

  // Handle programmatic swipe from buttons
  useEffect(() => {
    if (forcedDirection && isTop && !isFlyingOut) {
      const direction = forcedDirection === 'right' ? 1 : -1;
      setExitDirection(direction);
      setIsFlyingOut(true);
      setTimeout(() => {
        if (direction > 0) onSwipeRight();
        else onSwipeLeft();
      }, 300);
    }
  }, [forcedDirection, isTop]);

  const handleStart = (clientX: number, clientY: number) => {
    if (!isTop || isFlyingOut) return;
    setIsDragging(true);
    dragStart.current = { x: clientX, y: clientY };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || isFlyingOut) return;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    setOffset({ x: dx, y: dy });
  };

  const handleEnd = () => {
    if (!isDragging || isFlyingOut) return;
    setIsDragging(false);

    if (Math.abs(offset.x) > threshold) {
      const direction = offset.x > 0 ? 1 : -1;
      setExitDirection(direction);
      setIsFlyingOut(true);
      
      setTimeout(() => {
        if (direction > 0) onSwipeRight();
        else onSwipeLeft();
      }, 300);
    } else {
      setOffset({ x: 0, y: 0 });
    }
  };

  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);

  useEffect(() => {
    const handleGlobalUp = () => isDragging && handleEnd();
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [isDragging, offset]);

  const rotation = offset.x / 15;
  const transform = isFlyingOut 
    ? `translate(${exitDirection * 1000}px, ${offset.y}px) rotate(${exitDirection * 45}deg)`
    : `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`;

  const likeOpacity = Math.min(Math.max(offset.x / threshold, 0), 1);
  const nopeOpacity = Math.min(Math.max(-offset.x / threshold, 0), 1);

  return (
    <div 
      className={`absolute inset-0 select-none ${!isDragging ? 'transition-all duration-300 cubic-bezier(0.175, 0.885, 0.32, 1.275)' : ''}`}
      style={{
        transform: transform,
        zIndex: isTop ? 10 : 0,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        opacity: isFlyingOut ? 0 : 1,
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-white border border-gray-100">
        <img 
          src={user.photos[0]} 
          alt={user.name} 
          className="w-full h-full object-cover pointer-events-none"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-bold tracking-tight">{user.name}, {user.age}</h2>
            <i className="fa-solid fa-circle-check text-blue-400 text-sm"></i>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-200 mb-4">
            <i className="fa-solid fa-location-dot"></i>
            <span>{user.city} • {user.district}</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {user.interests.slice(0, 3).map((interest, idx) => (
              <span key={idx} className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider">
                {interest}
              </span>
            ))}
          </div>
        </div>

        {/* Stamps */}
        <div 
          className="absolute top-12 left-10 border-4 border-green-500 text-green-500 font-black text-4xl px-4 py-1 rounded-xl rotate-[-20deg] uppercase tracking-widest pointer-events-none transition-opacity"
          style={{ opacity: likeOpacity, transform: `scale(${0.8 + likeOpacity * 0.4}) rotate(-20deg)` }}
        >
          M'NONGA
        </div>
        <div 
          className="absolute top-12 right-10 border-4 border-red-500 text-red-500 font-black text-4xl px-4 py-1 rounded-xl rotate-[20deg] uppercase tracking-widest pointer-events-none transition-opacity"
          style={{ opacity: nopeOpacity, transform: `scale(${0.8 + nopeOpacity * 0.4}) rotate(20deg)` }}
        >
          NÉ-YÉ
        </div>
      </div>
    </div>
  );
};

export default SwipeCard;
