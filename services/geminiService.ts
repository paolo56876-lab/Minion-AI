// FIX: Created geminiService.ts to handle all Gemini API interactions.
import { GoogleGenAI, Chat, GenerateContentResponse, Part, Content } from "@google/genai";

// Initialize the main AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Chat Service ---

let chatSession: Chat | null = null;

const initializeChat = () => {
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
        systemInstruction: 'You are a helpful and friendly AI assistant named Minion AI.',
    }
  });
};

export const sendMessageToChat = async (message: string, imageBase64?: string): Promise<GenerateContentResponse> => {
  if (!chatSession) {
    initializeChat();
  }
  if (!chatSession) throw new Error("Chat not initialized");

  const parts: Part[] = [{ text: message }];
  if (imageBase64) {
    // Assuming image is jpeg. A real app might need to determine mimetype.
    parts.push({
      inlineData: { data: imageBase64, mimeType: 'image/jpeg' },
    });
  }

  return await chatSession.sendMessage({ message: { parts } });
};

export const resetChat = () => {
  chatSession = null;
};

// --- Image Generation Service ---

export const generateImage = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

// --- Video Generation Service ---

// FIX: Added generateVideo function to call the Veo model for video generation.
export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string> => {
    // Per guidelines, create a new instance to ensure the latest key is used.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio,
        }
    });

    while (!operation.done) {
        // Poll every 10 seconds
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
        throw new Error("Video generation failed: No download link found.");
    }

    // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to download video: ${response.statusText}. Details: ${errorText}`);
    }

    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    return videoUrl;
};


// --- Video Analysis Service ---

const extractFramesFromVideo = (videoFile: File, onProgress: (progress: number) => void): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(videoFile);
        video.muted = true;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return reject(new Error('El contexto del lienzo no está disponible'));

        const frames: string[] = [];
        const maxFrames = 50; // A reasonable number of frames for a summary
        let framesExtracted = 0;

        video.onloadeddata = () => {
            if (video.duration > 301) { // 5 minutes + 1 sec buffer
                 URL.revokeObjectURL(video.src);
                 return reject(new Error("El video es demasiado largo. Por favor, proporciona un video de hasta 5 minutos."));
            }
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const duration = video.duration;
            const interval = duration > 0 ? duration / maxFrames : 0;

            const captureFrame = (seekTime: number) => {
                if (framesExtracted >= maxFrames) {
                    URL.revokeObjectURL(video.src);
                    resolve(frames);
                    return;
                }
                video.currentTime = seekTime;
            };

            video.onseeked = () => {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                // Get base64 string without data:image/jpeg;base64,
                const frameData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                frames.push(frameData);
                framesExtracted++;
                const progress = Math.min(99, Math.round((framesExtracted / maxFrames) * 100));
                onProgress(progress);
                
                if (interval > 0) {
                    captureFrame(framesExtracted * interval);
                } else {
                     URL.revokeObjectURL(video.src);
                     resolve(frames);
                }
            };
            
            video.onerror = e => reject(new Error("Error al procesar el archivo de video."));

            captureFrame(0);
        };
        
        video.onerror = (e) => {
            URL.revokeObjectURL(video.src);
            reject(new Error("Error al cargar el archivo de video."));
        };
    });
};

export const analyzeVideo = async (file: File, prompt: string, onProgress: (progress: number) => void): Promise<string> => {
    const frames = await extractFramesFromVideo(file, onProgress);
    onProgress(100); // Indicate frames are ready

    const spanishPrompt = `${prompt}\n\nPor favor, proporciona la respuesta exclusivamente en español.`;

    const frameParts: Part[] = frames.map(data => ({
        inlineData: { mimeType: 'image/jpeg', data },
    }));

    const contents: Content[] = [{
        parts: [{ text: spanishPrompt }, ...frameParts],
    }];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Flash is sufficient and faster for this kind of task
        contents,
    });
    
    return response.text;
};