import React, { useState } from 'react';
import { analyzeVideo } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { VideoScanIcon, FileTextIcon, ClipboardCopyIcon } from './IconComponents';

const analysisOptions = [
  {
    id: 'summary',
    label: 'Resumen Rápido',
    prompt: 'Provide a concise, one-paragraph summary of this video.'
  },
  {
    id: 'explanation',
    label: 'Explicación Detallada',
    prompt: 'Give a detailed explanation of the events in this video, including the sequence of actions and the main subjects involved.'
  },
  {
    id: 'highlights',
    label: 'Momentos Clave',
    prompt: 'Identify and list the key moments or highlights from this video as a bulleted list.'
  },
  {
    id: 'shot_by_shot',
    label: 'Descripción Plano a Plano',
    prompt: 'Describe the video frame by frame, detailing the visual elements and actions in each significant shot.'
  }
];


const VideoAnalyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState<string>(analysisOptions[0].prompt);
  const [copyStatus, setCopyStatus] = useState<string>('Copiar HTML');


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith('video/')) {
        setFile(selectedFile);
        setVideoSrc(URL.createObjectURL(selectedFile));
        setError(null);
        setResult(null);
      } else {
        setError('Por favor, selecciona un archivo de video válido.');
      }
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      const analysisResult = await analyzeVideo(file, selectedPrompt, setProgress);
      setResult(analysisResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
      setError(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportTxt = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'analisis_video.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportHtml = () => {
    if (!result) return;
    const htmlCode = `<pre>${result}</pre>`; 
    navigator.clipboard.writeText(htmlCode).then(() => {
        setCopyStatus('¡Copiado!');
        setTimeout(() => setCopyStatus('Copiar HTML'), 2000);
    }).catch(err => {
        console.error('Error al copiar el código HTML: ', err);
        setCopyStatus('Error');
        setTimeout(() => setCopyStatus('Copiar HTML'), 2000);
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-800/50 rounded-lg shadow-2xl backdrop-blur-md border border-yellow-400/20">
      <h2 className="text-2xl font-orbitron font-bold text-center mb-6 text-yellow-400">Análisis de Video</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="video-upload" className="block text-sm font-medium mb-1 text-gray-300">Subir Video (hasta 5 minutos)</label>
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-yellow-400 file:text-gray-900 hover:file:bg-yellow-300"
            disabled={isLoading}
          />
        </div>

        {videoSrc && (
          <div className="border-2 border-yellow-400/30 rounded-lg p-2">
            <video src={videoSrc} controls className="w-full h-auto rounded-md" />
          </div>
        )}

        {file && (
            <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Tipo de Análisis</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {analysisOptions.map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedPrompt(option.prompt)}
                        disabled={isLoading}
                        className={`text-left p-3 rounded-md transition-colors text-sm w-full font-medium ${
                        selectedPrompt === option.prompt
                            ? 'bg-yellow-400 text-gray-900 ring-2 ring-yellow-300'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        {option.label}
                    </button>
                    ))}
                </div>
            </div>
        )}


        <button
          type="submit"
          disabled={isLoading || !file}
          className="w-full bg-yellow-400 text-gray-900 rounded-md px-4 py-2 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors font-semibold flex items-center justify-center gap-2"
        >
          <VideoScanIcon />
          Analizar Video
        </button>
      </form>
      
      {isLoading && (
        <div className="mt-6 text-center">
            <LoadingSpinner />
            <p className="text-yellow-300 mt-2">Analizando video...</p>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-sm text-gray-400">{progress < 100 ? `Extrayendo fotogramas: ${progress}%` : "Enviando a la IA..."}</p>
        </div>
      )}
      {error && <p className="text-center text-red-400 mt-4">{error}</p>}
      {result && (
        <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-yellow-400">Resultado del Análisis</h3>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleExportTxt} 
                        title="Exportar a Archivo (.txt)" 
                        className="flex items-center gap-1.5 text-sm bg-gray-600 hover:bg-gray-500 text-gray-200 px-2 py-1 rounded-md transition-colors"
                    >
                        <FileTextIcon />
                        <span>Exportar TXT</span>
                    </button>
                    <button 
                        onClick={handleExportHtml} 
                        title="Copiar como código HTML" 
                        className="flex items-center gap-1.5 text-sm bg-gray-600 hover:bg-gray-500 text-gray-200 px-2 py-1 rounded-md transition-colors"
                    >
                        <ClipboardCopyIcon />
                        <span>{copyStatus}</span>
                    </button>
                </div>
            </div>
            <p className="whitespace-pre-wrap text-gray-300">{result}</p>
        </div>
      )}
    </div>
  );
};

export default VideoAnalyzer;