import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { AVAILABLE_MODELS, LOADING_STEPS } from './constants';
import { ApiKeyDialog } from './components/ApiKeyDialog';
import { CanvasArea } from './components/CanvasArea';
import { ConfigPanel } from './components/ConfigPanel';
import { IconSidebar, type AppTab } from './components/IconSidebar';
import { useApiKey } from './hooks/useApiKey';
import { useHistory } from './hooks/useHistory';
import { useVideoGeneration } from './hooks/useVideoGeneration';
import { toDisplayMessage } from './services/errors';
import type { AspectRatio, DurationSeconds, HistoryItem, LocalProfile, MediaFrame, ModelOption, Resolution } from './types';
import { blobToBase64, isImageWithinSizeLimit, isSupportedImage } from './utils/blob';
import { pcm16ToAudioBuffer } from './utils/audio';
import { creditCostFor } from './utils/credits';

const PricingModal = lazy(() => import('./components/PricingModal').then((module) => ({ default: module.PricingModal })));
const ProfileModal = lazy(() => import('./components/ProfileModal').then((module) => ({ default: module.ProfileModal })));

const PROFILE_STORAGE_KEY = 'clipgen.profile';

const EMPTY_PROFILE: LocalProfile = { displayName: '', email: '' };

function readProfile(): LocalProfile {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!stored) {
      return EMPTY_PROFILE;
    }
    const parsed = JSON.parse(stored) as Partial<LocalProfile>;
    return { displayName: parsed.displayName ?? '', email: parsed.email ?? '' };
  } catch (error) {
    console.warn('Could not read the local profile', error);
    return EMPTY_PROFILE;
  }
}

export function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('canvas');
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelOption>(AVAILABLE_MODELS[0] ?? { id: '', name: '', description: '' });
  const [resolution, setResolution] = useState<Resolution>('720p');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [durationSeconds, setDurationSeconds] = useState<DurationSeconds>(8);
  const [startFrame, setStartFrame] = useState<MediaFrame | null>(null);
  const [endFrame, setEndFrame] = useState<MediaFrame | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [localError, setLocalError] = useState('');
  const [profile, setProfile] = useState<LocalProfile>(readProfile);

  const { apiKey, hasApiKey, setApiKey } = useApiKey();
  const history = useHistory();
  const generation = useVideoGeneration(apiKey);
  const currentVideoUrlRef = useRef<string | null>(null);

  useEffect(() => {
    currentVideoUrlRef.current = currentVideoUrl;
  }, [currentVideoUrl]);

  const handleFrameSelected = useCallback(async (kind: 'start' | 'end', file: File): Promise<void> => {
    if (!isSupportedImage(file)) {
      setLocalError('Only image files can be used as a source frame.');
      return;
    }
    if (!isImageWithinSizeLimit(file)) {
      setLocalError('That image is larger than 10 MB. Please pick a smaller one.');
      return;
    }
    try {
      const data = await blobToBase64(file);
      const frame: MediaFrame = { data, mimeType: file.type, fileName: file.name };
      if (kind === 'start') {
        setStartFrame(frame);
      } else {
        setEndFrame(frame);
      }
      setLocalError('');
    } catch (error) {
      setLocalError(toDisplayMessage(error));
    }
  }, []);

  const handleGenerate = useCallback(async (): Promise<void> => {
    if (!hasApiKey) {
      setIsKeyDialogOpen(true);
      return;
    }
    setLocalError('');

    const outcome = await generation.generate({
      prompt,
      modelId: selectedModel.id,
      resolution,
      aspectRatio,
      durationSeconds,
      startFrame: startFrame ?? undefined,
      endFrame: endFrame ?? undefined,
    });

    if (!outcome) {
      return;
    }

    const entry = await history.add(
      {
        id: crypto.randomUUID(),
        prompt: prompt.trim() || 'Image to Video',
        modelId: selectedModel.id,
        resolution,
        aspectRatio,
        durationSeconds,
        createdAt: Date.now(),
      },
      outcome.blob,
    );

    setCurrentVideoUrl(entry.videoUrl);
    setActiveTab('canvas');
  }, [
    aspectRatio,
    durationSeconds,
    generation,
    hasApiKey,
    history,
    prompt,
    resolution,
    selectedModel.id,
    startFrame,
    endFrame,
  ]);

  const handleReadAloud = useCallback(async (): Promise<void> => {
    if (!apiKey) {
      setIsKeyDialogOpen(true);
      return;
    }
    setIsSpeaking(true);
    setLocalError('');
    try {
      const { createClient, synthesizeSpeech } = await import('./services/genaiClient');
      const client = createClient(apiKey);
      const bytes = await synthesizeSpeech(client, prompt);
      const context = new AudioContext({ sampleRate: 24000 });
      const buffer = pcm16ToAudioBuffer(bytes, context, 24000, 1);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.onended = () => {
        void context.close();
      };
      source.start();
    } catch (error) {
      setLocalError(toDisplayMessage(error));
    } finally {
      setIsSpeaking(false);
    }
  }, [apiKey, prompt]);

  const handleDownload = useCallback((): void => {
    const url = currentVideoUrlRef.current;
    if (!url) {
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = `clipgen_${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleSelectHistory = useCallback((item: HistoryItem): void => {
    setCurrentVideoUrl(item.videoUrl);
    setActiveTab('canvas');
  }, []);

  const handleSaveProfile = useCallback((nextProfile: LocalProfile): void => {
    setProfile(nextProfile);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
    } catch (error) {
      console.warn('Could not save the local profile', error);
    }
  }, []);

  const errorMessage = generation.error || localError;
  const canGenerate = hasApiKey && Boolean(prompt.trim() || startFrame) && !generation.isRunning;

  return (
    <div className={`app-container tab-${activeTab}`}>
      <IconSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenPricing={() => setIsPricingOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        displayName={profile.displayName || null}
      />

      <ConfigPanel
        prompt={prompt}
        onPromptChange={setPrompt}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        resolution={resolution}
        onResolutionChange={setResolution}
        durationSeconds={durationSeconds}
        onDurationChange={setDurationSeconds}
        startFrame={startFrame}
        endFrame={endFrame}
        onFrameSelected={(kind, file) => {
          void handleFrameSelected(kind, file);
        }}
        onFrameRemoved={(kind) => {
          if (kind === 'start') {
            setStartFrame(null);
          } else {
            setEndFrame(null);
          }
        }}
        onReadAloud={() => {
          void handleReadAloud();
        }}
        isSpeaking={isSpeaking}
        error={errorMessage}
        onDismissError={() => {
          setLocalError('');
          generation.resetError();
        }}
        onGenerate={() => {
          void handleGenerate();
        }}
        onCancel={generation.cancel}
        isRunning={generation.isRunning}
        canGenerate={canGenerate}
        hasApiKey={hasApiKey}
        onConnectKey={() => setIsKeyDialogOpen(true)}
        creditCost={creditCostFor(resolution)}
      />

      <CanvasArea
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isLoading={generation.isRunning}
        currentStep={Math.min(generation.stepIndex, LOADING_STEPS.length - 1)}
        currentVideoUrl={currentVideoUrl}
        onDownload={handleDownload}
        history={history.items}
        isHistoryLoading={history.isLoading}
        onSelectHistory={handleSelectHistory}
        onRemoveHistory={(id) => {
          void history.remove(id);
        }}
        onClearHistory={() => {
          void history.clear();
          setCurrentVideoUrl(null);
        }}
      />

      {isKeyDialogOpen && (
        <ApiKeyDialog
          hasExistingKey={hasApiKey}
          onSubmit={setApiKey}
          onClose={() => setIsKeyDialogOpen(false)}
        />
      )}

      <Suspense fallback={null}>
        {isPricingOpen && <PricingModal onClose={() => setIsPricingOpen(false)} />}
        {isProfileOpen && (
          <ProfileModal profile={profile} onSave={handleSaveProfile} onClose={() => setIsProfileOpen(false)} />
        )}
      </Suspense>
    </div>
  );
}
