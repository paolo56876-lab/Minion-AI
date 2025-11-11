import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { ImageIcon, DownloadIcon } from './IconComponents';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const url = await generateImage(prompt);
      setImageUrl(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    const filename = prompt.substring(0, 30).replace(/\s+/g, '_').toLowerCase() || 'generated_image';
    link.download = `minion-ai-${filename}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-800/50 rounded-lg shadow-2xl backdrop-blur-md border border-yellow-400/20">
      <h2 className="text-2xl font-orbitron font-bold text-center mb-6 text-yellow-400">Image Generation</h2>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2 mb-6">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A neon hologram of a cat driving at top speed"
          className="flex-grow w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="w-full sm:w-auto bg-yellow-400 text-gray-900 rounded-md px-4 py-2 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors font-semibold flex items-center justify-center gap-2"
        >
          <ImageIcon />
          Generate
        </button>
      </form>

      {isLoading && (
        <div className="flex justify-center items-center h-64 bg-gray-700/50 rounded-lg">
          <LoadingSpinner />
        </div>
      )}
      {error && <p className="text-center text-red-400 mt-4">{error}</p>}
      {imageUrl && (
        <div className="relative group mt-4 border-2 border-yellow-400/30 rounded-lg p-2">
          <img src={imageUrl} alt="Generated" className="w-full h-auto rounded-md" />
          <button
            onClick={handleDownload}
            className="absolute top-4 right-4 bg-gray-900/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
            title="Download Image"
          >
            <DownloadIcon />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;