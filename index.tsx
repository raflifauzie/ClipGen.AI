import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from '@google/genai';

const loadingMessages = [
  "Casting the digital actors...",
  "Setting up the virtual cameras...",
  "Rendering the first few frames...",
  "This can take a few minutes...",
  "Adding special effects and sound...",
  "Almost there, polishing the final cut...",
];

const VideoGeneratorApp = () => {
  // Core State
  const [prompt, setPrompt] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [lastGeneratedPrompt, setLastGeneratedPrompt] = useState<string>('');
  
  // App View & History State
  const [currentView, setCurrentView] = useState<'generator' | 'history'>('generator');
  const [promptHistory, setPromptHistory] = useState<string[]>([]);

  // Config State
  const [generationMode, setGenerationMode] = useState<'select' | 'text' | 'image'>('select');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [duration, setDuration] = useState<number>(5);
  const [stylePreset, setStylePreset] = useState<string>('cinematic');

  // UI/UX State
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [placeholder, setPlaceholder] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWelcomeBannerOpen, setIsWelcomeBannerOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [copyButtonText, setCopyButtonText] = useState('Copy');
  
  // Suggestions State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState<boolean>(false);

  // API & Credits State
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
  const [generationCost, setGenerationCost] = useState<number | null>(null);
  const [userCredits, setUserCredits] = useState<number>(50);

  // Refs
  const progressIntervalRef = useRef<number | null>(null);
  const fullPlaceholder = "A cinematic shot of a car driving on a rainy night.";

  useEffect(() => {
    const welcomeBannerShown = sessionStorage.getItem('welcomeBannerShown');
    if (!welcomeBannerShown) {
        setIsWelcomeBannerOpen(true);
    }

    const checkApiKey = async () => {
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setApiKeySelected(true);
      }
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    let index = 0;
    setPlaceholder('');
    const typingInterval = setInterval(() => {
        if (index < fullPlaceholder.length) {
            setPlaceholder(prev => prev + fullPlaceholder.charAt(index));
            index++;
        } else {
            clearInterval(typingInterval);
        }
    }, 50);

    return () => clearInterval(typingInterval);
  }, []);

  const calculateCredits = (duration: number, resolution: '720p' | '1080p'): number => {
    if (duration <= 5) {
      return resolution === '1080p' ? 2 : 1;
    }
    return resolution === '1080p' ? 4 : 2;
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if ((generationMode === 'text' && prompt.trim()) || (generationMode === 'image' && imageFile)) {
        setGenerationCost(calculateCredits(duration, resolution));
      } else {
        setGenerationCost(null);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [prompt, duration, resolution, imageFile, generationMode]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setApiKeySelected(true);
    }
  };

  const handleCloseWelcomeBanner = () => {
    setIsWelcomeBannerOpen(false);
    sessionStorage.setItem('welcomeBannerShown', 'true');
  };
  
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject('Failed to convert blob to base64');
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const processFile = async (file: File) => {
    if (file.type.startsWith('image/')) {
      setImageFile(file);
      const base64 = await blobToBase64(file);
      setImageBase64(base64);
      setError('');
    } else {
      setError('Please upload a valid image file (e.g., PNG, JPEG).');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleImageDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImageBase64(null);
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
  };

  const getPromptSuggestions = async () => {
    setSuggestionsLoading(true);
    setError('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Generate 5 short, creative, and diverse prompts for an AI video generation model. The prompts should be cinematic and visually interesting. Return them as a JSON array of strings.',
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },
        },
      });

      const suggestionsArray = JSON.parse(response.text);
      if (Array.isArray(suggestionsArray) && suggestionsArray.every(item => typeof item === 'string')) {
        setSuggestions(suggestionsArray);
      } else {
        throw new Error('Invalid format for suggestions');
      }

    } catch (e: any) {
      console.error(e);
      let errorMessage = 'Could not fetch suggestions.';
      if (e.message) {
        errorMessage = e.message;
      }
      if (errorMessage.includes("Requested entity was not found")) {
          errorMessage = "Your API key is invalid. Please select a valid key and try again.";
          setApiKeySelected(false);
      }
      setError(errorMessage);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const generateVideo = async () => {
    if (generationMode === 'text' && !prompt) {
      setError("Please enter a prompt.");
      return;
    }
    if (generationMode === 'image' && !imageFile) {
        setError("Please upload an image.");
        return;
    }
    if (generationCost === null || userCredits < generationCost) {
        setError("You don't have enough credits for this video configuration.");
        return;
    }
    
    if (generationMode === 'text' && prompt && !promptHistory.includes(prompt)) {
      setPromptHistory(prevHistory => [prompt, ...prevHistory].slice(0, 50));
    }
    
    setLastGeneratedPrompt(prompt);
    setLoading(true);
    setProgress(0);
    setError('');
    setVideoUrl(null);
    setSuggestions([]);
    let messageIndex = 0;
    setLoadingMessage(loadingMessages[messageIndex]);
    const messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
    }, 5000);
    
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = window.setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          return 95;
        }
        const increment = (100 - prev) / 100;
        return Math.min(prev + increment * 2, 95);
      });
    }, 200);


    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

      const styleMap: { [key: string]: string } = {
        cinematic: 'cinematic, dramatic lighting, high detail, 8k',
        anime: 'in the style of a beautifully animated anime film',
        pixel_art: 'in a retro 16-bit pixel art style, vibrant colors',
      };
      const styleModifier = styleMap[stylePreset] || '';
      const finalPrompt = [prompt, styleModifier].filter(Boolean).join(', ');
      
      const payload: any = {
          model: 'veo-3.1-fast-generate-preview',
          prompt: finalPrompt,
          config: {
            numberOfVideos: 1,
            resolution: resolution,
            aspectRatio: aspectRatio,
            durationSecs: duration,
          }
      };
      
      if (generationMode === 'image' && imageBase64 && imageFile) {
        payload.image = {
            imageBytes: imageBase64,
            mimeType: imageFile.type,
        };
      }
      
      let operation = await ai.models.generateVideos(payload);

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY!}`);
        const videoBlob = await response.blob();
        const url = URL.createObjectURL(videoBlob);
        setVideoUrl(url);
        setUserCredits(prev => prev - generationCost!);
      } else {
        throw new Error("Video generation completed, but no download link was found.");
      }
    } catch (e: any) {
      console.error(e);
      let errorMessage = 'An unexpected error occurred.';
      if (e.message) {
        errorMessage = e.message;
      }
      if (errorMessage.includes("Requested entity was not found")) {
          errorMessage = "Your API key is invalid. Please select a valid key and try again.";
          setApiKeySelected(false);
      }
      setError(errorMessage);
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setLoading(false);
      setProgress(0);
      clearInterval(messageInterval);
    }
  };

  const handleSelectPromptFromHistory = (selectedPrompt: string) => {
    setCurrentView('generator');
    setGenerationMode('text');
    setPrompt(selectedPrompt);
    setImageFile(null);
    setImageBase64(null);
    setVideoUrl(null);
    setError('');
  };
  
  const handleNavClick = (view: 'generator' | 'history') => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  }

  const handleDownload = () => {
    if (!videoUrl) return;
    const safePrompt = lastGeneratedPrompt.slice(0, 40).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = safePrompt ? `ClipGen_${safePrompt}.mp4` : 'ClipGen_video.mp4';
    
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (!videoUrl) return;
    
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const file = new File([blob], 'ClipGen_video.mp4', { type: 'video/mp4' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'AI Generated Video',
          text: `Check out this video I generated with ClipGen AI!`,
        });
      } else {
        setError("Your browser doesn't support sharing files.");
      }
    } catch (error) {
      console.error('Error sharing:', error);
      if ((error as Error).name !== 'AbortError') {
        setError('An error occurred while trying to share the video.');
      }
    }
  };

  const handleCopyReferralLink = () => {
    const referralLink = 'https://clipgen.ai/invite?ref=user123'; // This is a placeholder
    navigator.clipboard.writeText(referralLink).then(() => {
        setCopyButtonText('Copied!');
        setTimeout(() => setCopyButtonText('Copy'), 2000);
    }, (err) => {
        console.error('Could not copy text: ', err);
        setError('Failed to copy link.');
    });
  };

  const handleSubscribe = (creditsToAdd: number) => {
    setUserCredits(prev => prev + creditsToAdd);
    setIsPricingModalOpen(false);
  };

  const renderGeneratorView = () => {
    if (!apiKeySelected) {
      return (
        <div className="api-key-selector card-style">
          <h2>Select API Key</h2>
          <p>
            Video generation with Veo requires a Google AI API key associated with a project that has billing enabled.
            Please select your key to continue. For more info, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer">billing documentation</a>.
          </p>
          <button onClick={handleSelectKey}>Select API Key</button>
        </div>
      );
    }
    
    if (generationMode === 'select') {
      return (
        <div className="mode-selection-container card-style">
          <h2>Choose Generation Mode</h2>
          <p>Start with a text description or bring your own image to life.</p>
          <div className="mode-cards">
            <div className="mode-card" onClick={() => setGenerationMode('text')} role="button" tabIndex={0}>
              <div className="mode-card-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                <h3>Text to Video</h3>
                <span>Generate a video from a descriptive prompt.</span>
              </div>
              <button className="btn-select-mode" onClick={(e) => { e.stopPropagation(); setGenerationMode('text'); }}>
                  Start with Text
              </button>
            </div>
            <div className="mode-card" onClick={() => setGenerationMode('image')} role="button" tabIndex={0}>
              <div className="mode-card-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                <h3>Image to Video</h3>
                <span>Animate an image with an optional prompt.</span>
              </div>
              <button className="btn-select-mode" onClick={(e) => { e.stopPropagation(); setGenerationMode('image'); }}>
                  Start with Image
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="video-generator-app card-style">
          <div className="app-title">
            <button className="btn btn-back" onClick={() => {
                setGenerationMode('select');
                setPrompt('');
                setImageFile(null);
                setImageBase64(null);
                setVideoUrl(null);
                setError('');
            }} aria-label="Go back to mode selection">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
            <h2>Generate Cinematic Video</h2>
          </div>
          <div className="main-content">
            {generationMode === 'image' && (
              <div className="image-upload-container">
                {!imageBase64 ? (
                  <label htmlFor="image-upload" className="image-upload-area" 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleImageDrop}
                  >
                    <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} hidden />
                     <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2.8-3.3-4.9-6.3-4.9h-1.3c-.3-1.3-1-2.4-2.1-3.2A5.403 5.403 0 0 0 8 3c-2.4 0-4.4 1.7-5 4-.6 0-1.2.1-1.8.4-1.3.6-2.2 2-2.2 3.6 0 1.9 1.3 3.4 3 3.8h13.7c.9 0 1.7-.5 2.1-1.2z"></path><path d="M12 12v9"></path><path d="m16 16-4 4-4-4"></path></svg>
                    <span>Click or drag & drop to upload</span>
                  </label>
                ) : (
                  <div className="image-preview">
                    <img src={`data:${imageFile?.type};base64,${imageBase64}`} alt="Preview" />
                    <button onClick={removeImage} className="btn-remove-image" aria-label="Remove image">&times;</button>
                  </div>
                )}
              </div>
            )}
            <textarea
              className="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={generationMode === 'image' ? "Optional: Describe how the image should animate..." : placeholder}
              rows={generationMode === 'image' ? 2 : 4}
              disabled={loading}
            />
            <div className="style-preset-selector">
              <label>Style Preset</label>
              <div className="preset-buttons">
                <button
                  type="button"
                  className={`btn pill-btn ${stylePreset === 'cinematic' ? 'active' : ''}`}
                  onClick={() => setStylePreset('cinematic')}
                  disabled={loading}
                  aria-pressed={stylePreset === 'cinematic'}
                >
                  Cinematic
                </button>
                <button
                  type="button"
                  className={`btn pill-btn ${stylePreset === 'anime' ? 'active' : ''}`}
                  onClick={() => setStylePreset('anime')}
                  disabled={loading}
                  aria-pressed={stylePreset === 'anime'}
                >
                  Anime
                </button>
                <button
                  type="button"
                  className={`btn pill-btn ${stylePreset === 'pixel_art' ? 'active' : ''}`}
                  onClick={() => setStylePreset('pixel_art')}
                  disabled={loading}
                  aria-pressed={stylePreset === 'pixel_art'}
                >
                  Pixel Art
                </button>
              </div>
            </div>
            {generationMode === 'text' && (
              <div className="suggestions-area">
                <div className="suggestions-actions">
                    <button 
                        type="button" 
                        className="btn-suggest" 
                        onClick={getPromptSuggestions} 
                        disabled={loading || suggestionsLoading}
                        aria-label="Suggest prompts"
                    >
                        {suggestionsLoading ? <div className="spinner-small"></div> : 'Suggest Prompts'}
                    </button>
                </div>
                {suggestions.length > 0 && (
                    <div className="suggestions-container">
                        {suggestions.map((suggestion, index) => (
                            <button 
                                key={index} 
                                className="suggestion-pill"
                                onClick={() => setPrompt(suggestion)}
                                disabled={loading}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
              </div>
            )}
          </div>
          <div className="app-footer">
            <div className="controls-wrapper">
               {generationCost !== null && (
                <div className="credit-counter">
                  Estimated Credits: {generationCost}
                </div>
              )}
              <div className="footer-controls">
                <div className="aspect-ratio-selector">
                  <button
                      type="button"
                      className={`btn pill-btn ${aspectRatio === '16:9' ? 'active' : ''}`}
                      onClick={() => setAspectRatio('16:9')}
                      disabled={loading}
                      aria-label="Set aspect ratio to 16:9 (landscape)"
                  >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"></rect></svg>
                      <span>16:9</span>
                  </button>
                  <button
                      type="button"
                      className={`btn pill-btn ${aspectRatio === '9:16' ? 'active' : ''}`}
                      onClick={() => setAspectRatio('9:16')}
                      disabled={loading}
                      aria-label="Set aspect ratio to 9:16 (portrait)"
                  >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"></rect></svg>
                      <span>9:16</span>
                  </button>
                </div>
                <div className="resolution-selector">
                    <button
                        type="button"
                        className={`btn pill-btn ${resolution === '720p' ? 'active' : ''}`}
                        onClick={() => setResolution('720p')}
                        disabled={loading}
                        aria-label="Set resolution to 720p"
                    >
                        <span>720p</span>
                    </button>
                    <button
                        type="button"
                        className={`btn pill-btn ${resolution === '1080p' ? 'active' : ''}`}
                        onClick={() => setResolution('1080p')}
                        disabled={loading}
                        aria-label="Set resolution to 1080p HD"
                    >
                        <span>1080p</span>
                    </button>
                </div>
                <div className="duration-selector">
                  <input 
                    type="range" 
                    min="1" 
                    max="8" 
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    disabled={loading}
                    aria-label="Video duration in seconds"
                  />
                  <span className="duration-label">{duration}s</span>
                </div>
              </div>
            </div>
            <div className="footer-actions">
              <button type="button" className="btn" disabled={loading} aria-label="Use microphone">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>
              </button>
              <button 
                className="btn btn-submit" 
                onClick={generateVideo} 
                disabled={
                    loading || 
                    (generationMode === 'text' && !prompt) || 
                    (generationMode === 'image' && !imageFile) ||
                    (generationCost !== null && userCredits < generationCost)
                } 
                aria-label="Generate video">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
              </button>
            </div>
          </div>
          {error && <div className="error-container"><p>{error}</p></div>}
        </div>
        
        <div className="result-container card-style">
            {videoUrl ? (
                <>
                    <h2>Your Video is Ready!</h2>
                    <video src={videoUrl} controls autoPlay loop />
                    <div className="result-actions">
                        <button className="btn-result-action" onClick={handleDownload}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            <span>Download</span>
                        </button>
                        {navigator.share && (
                            <button className="btn-result-action" onClick={handleShare}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                <span>Share</span>
                            </button>
                        )}
                    </div>
                </>
            ) : (
                <div className="video-placeholder">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M15 13l-3 3-3-3"></path><path d="M12 16V8"></path><path d="M21 3H3v18h18V3z"></path><path d="M9 3v18"></path></svg>
                    <h3>Video Player</h3>
                    <p>Your successfully generated video will appear here.</p>
                </div>
            )}
        </div>
      </>
    );
  };
  
  const renderHistoryView = () => {
    return (
      <div className="history-view card-style">
        <div className="history-header">
            <h2>Prompt History</h2>
            <p>View and re-run your previous text-to-video prompts.</p>
        </div>
        {promptHistory.length === 0 ? (
            <div className="empty-history">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                <h3>No History Yet</h3>
                <p>Your generated text prompts will appear here.</p>
                <button className="btn-primary" onClick={() => handleNavClick('generator')}>Create a new video</button>
            </div>
        ) : (
            <ul className="history-list">
                {promptHistory.map((histPrompt, index) => (
                    <li key={index} className="history-item">
                        <p className="history-prompt-text">{histPrompt}</p>
                        <button className="btn-use-prompt" onClick={() => handleSelectPromptFromHistory(histPrompt)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                            <span>Use Prompt</span>
                        </button>
                    </li>
                ))}
            </ul>
        )}
      </div>
    );
  };

  return (
     <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
        <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div>
              <div className="sidebar-header">
                  <div className="sidebar-brand">ClipGen AI</div>
                  <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} aria-label="Close navigation menu">&times;</button>
              </div>
              <nav className="sidebar-nav">
                  <ul>
                      <li className="nav-item">
                          <button className={`nav-link ${currentView === 'generator' ? 'active' : ''}`} onClick={() => handleNavClick('generator')}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                              <span>Generator</span>
                          </button>
                      </li>
                      <li className="nav-item">
                          <button className={`nav-link ${currentView === 'history' ? 'active' : ''}`} onClick={() => handleNavClick('history')}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"></path><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                              <span>Prompt History</span>
                          </button>
                      </li>
                      <li className="nav-item">
                          <button className="nav-link" onClick={() => { setIsPricingModalOpen(true); setIsSidebarOpen(false); }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                              <span>Pricing</span>
                          </button>
                      </li>
                      <li className="nav-item">
                          <button className="nav-link" onClick={() => { setIsReferralModalOpen(true); setIsSidebarOpen(false); }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
                              <span>Refer a Friend</span>
                          </button>
                      </li>
                  </ul>
              </nav>
          </div>
          <div className="sidebar-footer">
              <div className="user-profile" onClick={() => setIsAuthModalOpen(true)} role="button" tabIndex={0}>
                  <div className="user-avatar">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                  <div className="user-details">
                      <span className="user-name">My Profile</span>
                      <span className="user-credits">Credits: <strong>{userCredits}</strong></span>
                  </div>
              </div>
          </div>
        </aside>

        <main className="main-content-area">
          <header className="main-header">
            <button className="sidebar-toggle-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Open navigation menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          </header>
          <div className="content-scroll-wrapper">
            {currentView === 'generator' ? renderGeneratorView() : renderHistoryView()}
          </div>
        </main>
      
        {loading && (
          <div className="loading-overlay">
            <div className="loading-content">
              {generationMode === 'image' && imageBase64 ? (
                <div className="loading-preview-wrapper">
                  <img 
                      src={`data:${imageFile?.type};base64,${imageBase64}`} 
                      alt="Generation in progress" 
                      className="loading-preview-image" 
                  />
                </div>
              ) : (
                  <div className="spinner"></div>
              )}
              <p>{loadingMessage}</p>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>
        )}

        {isAuthModalOpen && (
          <div className="auth-modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
              <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                  <button className="auth-modal-close-btn" onClick={() => setIsAuthModalOpen(false)} aria-label="Close sign in modal">&times;</button>
                  <div className="auth-modal-header">
                      <h2>Sign In / Sign Up</h2>
                  </div>
                  <div className="auth-modal-body">
                      <label htmlFor="email-input">Email address</label>
                      <input id="email-input" type="email" placeholder="you@example.com" />
                      <button className="auth-btn email-btn">Continue with Email</button>
                      <div className="divider"><span>or</span></div>
                      <button className="auth-btn google-btn">
                          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18"><path d="M16.51 8.1H8.98v3.2h4.57c-.2 1.18-.86 2.18-1.94 2.84v2.02h2.6c1.52-1.4 2.38-3.48 2.38-5.86 0-.6-.05-1.18-.15-1.76Z" fill="#4285F4"></path><path d="M8.98 17c2.43 0 4.47-.8 5.96-2.18l-2.6-2.02c-.8.54-1.82.86-3.36.86-2.58 0-4.78-1.72-5.57-4.02H.96v2.09c1.65 3.28 4.77 5.24 8.02 5.24Z" fill="#34A853"></path><path d="M3.41 10.71a5.48 5.48 0 0 1 0-3.42V5.2H.96a8.99 8.99 0 0 0 0 7.6l2.45-2.09Z" fill="#FBBC05"></path><path d="M8.98 3.4c1.3 0 2.5.45 3.42 1.35l2.3-2.3C13.45.8 11.4 0 8.98 0 5.73 0 2.61 1.96.96 5.2l2.45 2.09c.79-2.3 2.99-4.02 5.57-4.02Z" fill="#EA4335"></path></svg>
                          Sign in with Google
                      </button>
                  </div>
                  <div className="auth-modal-footer">
                      <p>By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</p>
                  </div>
              </div>
          </div>
        )}

        {isPricingModalOpen && (
            <div className="pricing-modal-overlay" onClick={() => setIsPricingModalOpen(false)}>
                <div className="pricing-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="pricing-modal-title">
                    <button className="pricing-modal-close-btn" onClick={() => setIsPricingModalOpen(false)} aria-label="Close pricing modal">&times;</button>
                    <div className="pricing-header">
                        <h2 id="pricing-modal-title">Choose Your Plan</h2>
                        <p>Unlock more features and credits to create amazing videos.</p>
                        <div className="billing-toggle-buttons">
                            <button
                                className={`btn-toggle ${billingCycle === 'monthly' ? 'active' : ''}`}
                                onClick={() => setBillingCycle('monthly')}
                                aria-pressed={billingCycle === 'monthly'}
                            >
                                Monthly
                            </button>
                            <button
                                className={`btn-toggle ${billingCycle === 'annual' ? 'active' : ''}`}
                                onClick={() => setBillingCycle('annual')}
                                aria-pressed={billingCycle === 'annual'}
                            >
                                Annual <span className="discount-badge">Save 20%</span>
                            </button>
                        </div>
                    </div>
                    <div className="pricing-plans">
                        <div className="pricing-card">
                            <h3 className="plan-name">Hobbyist</h3>
                            <p className="price">${billingCycle === 'monthly' ? '10' : '8'}<span className="price-period">/mo</span></p>
                            <p className="billing-info">{billingCycle === 'annual' ? 'Billed as $96 per year' : 'Billed monthly'}</p>
                            <button className="btn-subscribe" onClick={() => handleSubscribe(billingCycle === 'monthly' ? 120 : 1440)}>
                                {billingCycle === 'monthly' ? 'Get 120 Credits' : 'Get 1440 Credits'}
                            </button>
                            <ul className="features-list">
                                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Up to 120 generations/mo</li>
                                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Standard generation speed</li>
                                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>720p & 1080p Resolution</li>
                            </ul>
                        </div>
                        <div className="pricing-card popular">
                             <div className="popular-badge">Most Popular</div>
                            <h3 className="plan-name">Pro</h3>
                            <p className="price">${billingCycle === 'monthly' ? '25' : '20'}<span className="price-period">/mo</span></p>
                            <p className="billing-info">{billingCycle === 'annual' ? 'Billed as $240 per year' : 'Billed monthly'}</p>
                             <button className="btn-subscribe" onClick={() => handleSubscribe(billingCycle === 'monthly' ? 300 : 3600)}>
                                {billingCycle === 'monthly' ? 'Get 300 Credits' : 'Get 3600 Credits'}
                            </button>
                            <ul className="features-list">
                                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Up to 300 generations/mo</li>
                                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Priority generation speed</li>
                                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>No watermarks</li>
                                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Community support</li>
                            </ul>
                        </div>
                        <div className="pricing-card">
                            <h3 className="plan-name">Expert</h3>
                            <p className="price">${billingCycle === 'monthly' ? '50' : '40'}<span className="price-period">/mo</span></p>
                            <p className="billing-info">{billingCycle === 'annual' ? 'Billed as $480 per year' : 'Billed monthly'}</p>
                             <button className="btn-subscribe" onClick={() => handleSubscribe(billingCycle === 'monthly' ? 750 : 9000)}>
                                {billingCycle === 'monthly' ? 'Get 750 Credits' : 'Get 9000 Credits'}
                            </button>
                            <ul className="features-list">
                                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Up to 750 generations/mo</li>
                                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Fastest generation speed</li>
                                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Access to beta features</li>
                                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Dedicated support</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {isReferralModalOpen && (
            <div className="referral-modal-overlay" onClick={() => setIsReferralModalOpen(false)}>
                <div className="referral-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="referral-modal-close-btn" onClick={() => setIsReferralModalOpen(false)} aria-label="Close referral modal">&times;</button>
                    <div className="referral-modal-content">
                        <div className="referral-icon">
                           <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
                        </div>
                        <h2>Refer a Friend</h2>
                        <p className="referral-text">Refer a friend and get Rp 50k worth of credit token</p>
                        <div className="referral-link-container">
                            <input type="text" value="https://clipgen.ai/invite?ref=user123" readOnly aria-label="Referral link" />
                            <button className="btn-copy" onClick={handleCopyReferralLink}>
                                {copyButtonText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {isWelcomeBannerOpen && (
          <div className="welcome-banner-overlay" onClick={handleCloseWelcomeBanner}>
              <div className="welcome-banner-modal" onClick={(e) => e.stopPropagation()}>
                  <button className="welcome-banner-close-btn" onClick={handleCloseWelcomeBanner} aria-label="Close welcome banner">&times;</button>
                  <div className="welcome-banner-video-container">
                      {/* GUIDELINE: To change the video, replace the src URL below with your own video file URL. */}
                      <video 
                          src="https://assets.mixkit.co/videos/preview/mixkit-nebula-plasma-leaking-from-a-sphere-4147-large.mp4" 
                          autoPlay 
                          muted 
                          loop 
                          playsInline 
                      />
                  </div>
                  <div className="welcome-banner-content">
                      <h2>Bring Your Ideas to Life</h2>
                      <p>Generate stunning, high-quality videos from a simple text prompt or image using the power of AI.</p>
                      <button className="btn-primary" onClick={handleCloseWelcomeBanner}>Start Creating</button>
                  </div>
              </div>
          </div>
        )}
     </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <VideoGeneratorApp />
    </React.StrictMode>
  );
} else {
    console.error('Root element with id "root" not found in the document.');
}