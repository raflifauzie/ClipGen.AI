import { LOADING_STEPS } from '../constants';
import type { AppTab } from './IconSidebar';
import { HistoryCard } from './HistoryCard';
import type { HistoryItem } from '../types';

interface CanvasAreaProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  isLoading: boolean;
  currentStep: number;
  currentVideoUrl: string | null;
  onDownload: () => void;
  history: HistoryItem[];
  isHistoryLoading: boolean;
  onSelectHistory: (item: HistoryItem) => void;
  onRemoveHistory: (id: string) => void;
  onClearHistory: () => void;
}

export function CanvasArea({
  activeTab,
  onTabChange,
  isLoading,
  currentStep,
  currentVideoUrl,
  onDownload,
  history,
  isHistoryLoading,
  onSelectHistory,
  onRemoveHistory,
  onClearHistory,
}: CanvasAreaProps) {
  return (
    <main className="canvas-area">
      <div className="canvas-tabs" role="tablist" aria-label="Workspace">
        <button
          type="button"
          role="tab"
          id="tab-canvas"
          aria-selected={activeTab === 'canvas'}
          aria-controls="panel-canvas"
          className={`tab-btn ${activeTab === 'canvas' ? 'active' : ''}`}
          onClick={() => onTabChange('canvas')}
        >
          Canvas
        </button>
        <button
          type="button"
          role="tab"
          id="tab-library"
          aria-selected={activeTab === 'generations'}
          aria-controls="panel-library"
          className={`tab-btn ${activeTab === 'generations' ? 'active' : ''}`}
          onClick={() => onTabChange('generations')}
        >
          Library
        </button>
      </div>

      <div className="canvas-content">
        {activeTab === 'canvas' ? (
          <div role="tabpanel" id="panel-canvas" aria-labelledby="tab-canvas">
            {isLoading ? (
              <div className="loading-steps-container">
                <h3 style={{ marginBottom: 20 }}>Creating your video...</h3>
                {LOADING_STEPS.map((step, index) => {
                  const status = index < currentStep ? 'completed' : index === currentStep ? 'active' : 'pending';

                  return (
                    <div key={step} className={`step-item ${status}`}>
                      <div className="step-icon" aria-hidden="true">
                        {status === 'completed' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        {status === 'active' && <div className="mini-spinner" />}
                        {status === 'pending' && <div className="empty-dot" />}
                      </div>
                      <span className="step-label">{step}</span>
                      <span className="visually-hidden">
                        {status === 'completed' ? 'done' : status === 'active' ? 'in progress' : 'waiting'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : currentVideoUrl ? (
              <div className="video-wrapper">
                <video src={currentVideoUrl} controls autoPlay loop playsInline />
                <div className="video-actions">
                  <button type="button" className="action-btn" onClick={onDownload}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <svg className="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1" aria-hidden="true">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                <h3>No video generations yet</h3>
                <p>Generate your first video to see it here.</p>
              </div>
            )}
          </div>
        ) : (
          <div role="tabpanel" id="panel-library" aria-labelledby="tab-library">
            <div className="generations-grid">
              {isHistoryLoading ? (
                <div className="empty-state" style={{ gridColumn: '1/-1', marginTop: 40 }}>
                  <p>Loading your library...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: '1/-1', marginTop: 40 }}>
                  <p>No history yet.</p>
                </div>
              ) : (
                history.map((item) => (
                  <HistoryCard key={item.id} item={item} onSelect={onSelectHistory} onRemove={onRemoveHistory} />
                ))
              )}
            </div>

            {history.length > 0 && (
              <div className="library-actions">
                <button type="button" className="btn-text" onClick={onClearHistory}>
                  Clear the library
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
