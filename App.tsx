import React, { useState } from 'react';
import Header from './components/Header';
import Chat from './components/Chat';
import ImageGenerator from './components/ImageGenerator';
import VideoAnalyzer from './components/VideoAnalyzer';
import { Feature } from './types';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>('chat');

  const renderFeature = () => {
    switch (activeFeature) {
      case 'image':
        return <ImageGenerator />;
      case 'analyze':
        return <VideoAnalyzer />;
      case 'chat':
      default:
        return <Chat />;
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200">
      <div className="absolute inset-0 bg-grid-yellow-400/10 [mask-image:linear-gradient(to_bottom,white_5%,transparent_100%)]"></div>
      <div className="relative z-10 flex flex-col h-screen">
        <Header activeFeature={activeFeature} setActiveFeature={setActiveFeature} />
        <main className="flex-grow overflow-y-auto p-4 md:p-6 flex justify-center">
          {renderFeature()}
        </main>
      </div>
    </div>
  );
};

export default App;