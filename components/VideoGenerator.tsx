
import React, { useState, useEffect, useCallback } from 'react';
import { generateVideo } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { VideoIcon } from './IconComponents';

// Assume window.aistudio is available
// FIX: Removed declare global block to fix redeclaration error. The type for window.aistudio is expected to be available globally.

const loadingMessages = [
    "Warming up the digital director's chair...",
    "Choreographing pixels into motion...",
    "Rendering your cinematic masterpiece...",
    "Adjusting the lighting on set...",
    "Finalizing the special effects...",
    "The final cut is almost ready..."
];

const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [hasApiKey, setHasApiKey] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

    const checkApiKey = useCallback(async () => {
        if (window.aistudio) {
            const keySelected = await window.aistudio.hasSelectedApiKey();
            setHasApiKey(keySelected);
        } else {
            setError("AI Studio context is not available.");
        }
    }, []);

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);
    
    useEffect(() => {
        let interval: number;
        if (isLoading) {
            interval = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    return loadingMessages[(currentIndex + 1) % loadingMessages.length];
                });
            }, 5000);
        }
        return () => window.clearInterval(interval);
    }, [isLoading]);


    const handleSelectKey = async () => {
        try {
            await window.aistudio.openSelectKey();
            // Assume success and update UI immediately to avoid race conditions
            setHasApiKey(true);
        } catch (e) {
            setError("Failed to open API key selection.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        setLoadingMessage(loadingMessages[0]);

        try {
            const url = await generateVideo(prompt, aspectRatio);
            setVideoUrl(url);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            if (errorMessage.includes("Requested entity was not found")) {
                setError("API Key not found or invalid. Please select a valid key.");
                setHasApiKey(false);
            } else {
                setError(`Error: ${errorMessage}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!hasApiKey) {
        return (
            <div className="max-w-2xl mx-auto p-6 bg-gray-800/50 rounded-lg shadow-2xl backdrop-blur-md border border-yellow-400/20 text-center">
                <h2 className="text-2xl font-orbitron font-bold text-center mb-4 text-yellow-400">Video Generation with Veo</h2>
                <p className="mb-4">To generate videos, you must select an API key. This enables access to the powerful Veo model.</p>
                <p className="text-sm text-gray-400 mb-6">For more information on billing, visit <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">ai.google.dev/gemini-api/docs/billing</a>.</p>
                <button onClick={handleSelectKey} className="bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-500 transition-colors font-semibold">
                    Select API Key
                </button>
                {error && <p className="text-red-400 mt-4">{error}</p>}
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6 bg-gray-800/50 rounded-lg shadow-2xl backdrop-blur-md border border-yellow-400/20">
            <h2 className="text-2xl font-orbitron font-bold text-center mb-6 text-yellow-400">Video Generation</h2>
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                <div>
                    <label htmlFor="prompt" className="block text-sm font-medium mb-1 text-gray-300">Prompt</label>
                    <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A majestic lion waking up at sunrise"
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                        rows={3}
                        disabled={isLoading}
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">Aspect Ratio</label>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setAspectRatio('16:9')} className={`px-4 py-2 rounded-md ${aspectRatio === '16:9' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700'}`}>16:9 (Landscape)</button>
                        <button type="button" onClick={() => setAspectRatio('9:16')} className={`px-4 py-2 rounded-md ${aspectRatio === '9:16' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700'}`}>9:16 (Portrait)</button>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="w-full bg-yellow-400 text-gray-900 rounded-md px-4 py-2 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                    <VideoIcon />
                    Generate Video
                </button>
            </form>

            {isLoading && (
                <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                    <LoadingSpinner />
                    <p className="mt-4 text-yellow-300">{loadingMessage}</p>
                    <p className="text-sm text-gray-400 mt-2">Video generation can take a few minutes. Please be patient.</p>
                </div>
            )}
            {error && <p className="text-center text-red-400 mt-4">{error}</p>}
            {videoUrl && (
                <div className="mt-4 border-2 border-yellow-400/30 rounded-lg p-2">
                    <video src={videoUrl} controls className="w-full h-auto rounded-md" />
                </div>
            )}
        </div>
    );
};

export default VideoGenerator;