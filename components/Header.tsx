import React from 'react';
import { Feature } from '../types';
import { ChatIcon, ImageIcon, VideoScanIcon } from './IconComponents';

interface HeaderProps {
  activeFeature: Feature;
  setActiveFeature: (feature: Feature) => void;
}

const Header: React.FC<HeaderProps> = ({ activeFeature, setActiveFeature }) => {
  // FIX: Changed JSX.Element to React.ReactNode to resolve namespace error.
  const navItems: { id: Feature; label: string; icon: React.ReactNode }[] = [
    { id: 'chat', label: 'Chat', icon: <ChatIcon /> },
    { id: 'image', label: 'Generate Image', icon: <ImageIcon /> },
    { id: 'analyze', label: 'Analyze Video', icon: <VideoScanIcon /> },
  ];

  return (
    <header className="bg-gray-900/50 backdrop-blur-sm border-b border-yellow-400/20 p-4 flex flex-col sm:flex-row justify-between items-center z-20 flex-shrink-0">
      <h1 className="text-2xl md:text-3xl font-orbitron font-bold text-yellow-400 tracking-widest mb-4 sm:mb-0">
        MINION AI
      </h1>
      <nav className="flex items-center gap-2 md:gap-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveFeature(item.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeFeature === item.id
                ? 'bg-yellow-400 text-gray-900'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="hidden md:inline">{item.label}</span>
          </button>
        ))}
      </nav>
    </header>
  );
};

export default Header;