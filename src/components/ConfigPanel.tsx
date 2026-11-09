import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';

import { AVAILABLE_MODELS, SUPPORTED_ASPECT_RATIOS, SUPPORTED_DURATIONS, SUPPORTED_RESOLUTIONS } from '../constants';
import { useOutsideClick } from '../hooks/useOutsideClick';
import type { AspectRatio, DurationSeconds, MediaFrame, ModelOption, Resolution } from '../types';

interface ConfigPanelProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  selectedModel: ModelOption;
  onModelChange: (model: ModelOption) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (value: AspectRatio) => void;
  resolution: Resolution;
  onResolutionChange: (value: Resolution) => void;
  durationSeconds: DurationSeconds;
  onDurationChange: (value: DurationSeconds) => void;
  startFrame: MediaFrame | null;
  endFrame: MediaFrame | null;
  onFrameSelected: (kind: 'start' | 'end', file: File) => void;
  onFrameRemoved: (kind: 'start' | 'end') => void;
  onReadAloud: () => void;
  isSpeaking: boolean;
  error: string;
  onDismissError: () => void;
  onGenerate: () => void;
  onCancel: () => void;
  isRunning: boolean;
  canGenerate: boolean;
  hasApiKey: boolean;
  onConnectKey: () => void;
  creditCost: number;
}

export function ConfigPanel({
  prompt,
  onPromptChange,
  selectedModel,
  onModelChange,
  aspectRatio,
  onAspectRatioChange,
  resolution,
  onResolutionChange,
  durationSeconds,
  onDurationChange,
  startFrame,
  endFrame,
  onFrameSelected,
  onFrameRemoved,
  onReadAloud,
  isSpeaking,
  error,
  onDismissError,
  onGenerate,
  onCancel,
  isRunning,
  canGenerate,
  hasApiKey,
  onConnectKey,
  creditCost,
}: ConfigPanelProps) {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [activeModelIndex, setActiveModelIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = (): void => setIsModelDropdownOpen(false);
  useOutsideClick(dropdownRef, closeDropdown, isModelDropdownOpen);

  const handleModelKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        setIsModelDropdownOpen(true);
        setActiveModelIndex((current) => {
          const delta = event.key === 'ArrowDown' ? 1 : -1;
          return (current + delta + AVAILABLE_MODELS.length) % AVAILABLE_MODELS.length;
        });
        break;
      }
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isModelDropdownOpen) {
          const model = AVAILABLE_MODELS[activeModelIndex];
          if (model) {
            onModelChange(model);
          }
          closeDropdown();
        } else {
          setIsModelDropdownOpen(true);
        }
        break;
      case 'Escape':
        closeDropdown();
        break;
      default:
        break;
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, kind: 'start' | 'end'): void => {
    const file = event.target.files?.[0];
    if (file) {
      onFrameSelected(kind, file);
      event.target.value = '';
    }
  };

  return (
    <section className="config-panel" aria-label="Generation settings">
      <div className="panel-header">
        <div className="panel-title-row">
          <h1>Video</h1>
          <div className="model-dropdown-container" ref={dropdownRef}>
            <button
              type="button"
              className={`model-selector ${isModelDropdownOpen ? 'active' : ''}`}
              onClick={() => setIsModelDropdownOpen((open) => !open)}
              onKeyDown={handleModelKeyDown}
              aria-haspopup="listbox"
              aria-expanded={isModelDropdownOpen}
              aria-label={`Model: ${selectedModel.name}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
              {selectedModel.name}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                style={{ transform: isModelDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isModelDropdownOpen && (
              <div className="model-dropdown-menu" role="listbox" aria-label="Video model">
                {AVAILABLE_MODELS.map((model, index) => (
                  <div
                    key={model.id}
                    role="option"
                    aria-selected={selectedModel.id === model.id}
                    className={`model-dropdown-item ${selectedModel.id === model.id ? 'selected' : ''}`}
                    onClick={() => {
                      onModelChange(model);
                      closeDropdown();
                    }}
                    onMouseEnter={() => setActiveModelIndex(index)}
                  >
                    <div className="model-item-name">{model.name}</div>
                    <div className="model-item-desc">{model.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="panel-description">{selectedModel.description}</p>
      </div>

      <div className="config-content">
        <div>
          <label className="section-label" htmlFor="prompt-input">
            Prompt
          </label>
          <div className="prompt-container">
            <textarea
              id="prompt-input"
              className="prompt-textarea"
              placeholder="Describe your video..."
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
            />
            <button
              type="button"
              className="tts-btn"
              onClick={onReadAloud}
              disabled={!prompt || isSpeaking}
              title="Read aloud"
              aria-label="Read the prompt aloud"
            >
              {isSpeaking ? (
                <div className="mini-spinner" style={{ width: 14, height: 14 }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <span className="section-label">Source Images</span>
          <div className="media-inputs-grid">
            <label className="media-upload-box">
              <span className="visually-hidden">Start frame image</span>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => handleFileChange(event, 'start')}
                aria-label="Start frame image"
              />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Start Frame</span>
            </label>

            {startFrame && (
              <div className="media-upload-box" style={{ cursor: 'default' }}>
                <img
                  src={`data:${startFrame.mimeType};base64,${startFrame.data}`}
                  className="preview-thumb"
                  alt={`Start frame: ${startFrame.fileName}`}
                />
                <button
                  type="button"
                  className="remove-media-btn"
                  onClick={() => onFrameRemoved('start')}
                  aria-label="Remove the start frame"
                >
                  &times;
                </button>
                <span className="media-badge">Start</span>
              </div>
            )}

            <label className="media-upload-box">
              <span className="visually-hidden">End frame image</span>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => handleFileChange(event, 'end')}
                aria-label="End frame image"
              />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>End Frame</span>
            </label>

            {endFrame && (
              <div className="media-upload-box" style={{ cursor: 'default' }}>
                <img
                  src={`data:${endFrame.mimeType};base64,${endFrame.data}`}
                  className="preview-thumb"
                  alt={`End frame: ${endFrame.fileName}`}
                />
                <button
                  type="button"
                  className="remove-media-btn"
                  onClick={() => onFrameRemoved('end')}
                  aria-label="Remove the end frame"
                >
                  &times;
                </button>
                <span className="media-badge">End</span>
              </div>
            )}
          </div>
        </div>

        <div className="settings-group">
          <div className="setting-item">
            <div className="setting-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Duration
            </div>
            <div className="setting-control">
              <select
                className="setting-select"
                value={durationSeconds}
                onChange={(event) => onDurationChange(Number(event.target.value) as DurationSeconds)}
                aria-label="Video duration in seconds"
              >
                {SUPPORTED_DURATIONS.map((seconds) => (
                  <option key={seconds} value={seconds}>
                    {seconds}s
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="2" y="7" width="20" height="10" rx="2" ry="2" />
              </svg>
              Aspect ratio
            </div>
            <div className="setting-control">
              <select
                className="setting-select"
                value={aspectRatio}
                onChange={(event) => onAspectRatioChange(event.target.value as AspectRatio)}
                aria-label="Aspect ratio"
              >
                {SUPPORTED_ASPECT_RATIOS.map((ratio) => (
                  <option key={ratio} value={ratio}>
                    {ratio}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 2v20M2 12h20" />
                <path d="m4.93 4.93 14.14 14.14" />
                <path d="m19.07 4.93-14.14 14.14" />
              </svg>
              Resolution
            </div>
            <div className="setting-control">
              <select
                className="setting-select"
                value={resolution}
                onChange={(event) => onResolutionChange(event.target.value as Resolution)}
                aria-label="Resolution"
              >
                {SUPPORTED_RESOLUTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="config-footer">
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button type="button" className="error-dismiss" onClick={onDismissError} aria-label="Dismiss the error message">
              &times;
            </button>
          </div>
        )}

        {isRunning ? (
          <button type="button" className="btn-primary" onClick={onCancel}>
            Cancel generation
          </button>
        ) : hasApiKey ? (
          <button type="button" className="generate-btn" onClick={onGenerate} disabled={!canGenerate}>
            <span style={{ marginRight: '6px' }}>✨</span>
            Generate • {creditCost} Credits
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={onConnectKey}>
            Connect your API key
          </button>
        )}
      </div>
    </section>
  );
}
