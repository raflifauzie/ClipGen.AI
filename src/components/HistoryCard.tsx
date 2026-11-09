import type { HistoryItem } from '../types';

interface HistoryCardProps {
  item: HistoryItem;
  onSelect: (item: HistoryItem) => void;
  onRemove: (id: string) => void;
}

export function HistoryCard({ item, onSelect, onRemove }: HistoryCardProps) {
  const createdAt = new Date(item.createdAt);
  const summary = `${item.resolution} • ${item.aspectRatio} • ${item.durationSeconds}s`;

  return (
    <div className="history-card">
      <button
        type="button"
        className="history-open"
        onClick={() => onSelect(item)}
        aria-label={`Show the video for ${item.prompt}`}
      >
        <span className="history-thumbnail">
          <video src={item.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted preload="metadata" />
        </span>
        <span className="history-info">
          <span className="history-prompt">{item.prompt}</span>
          <span className="history-date">
            {summary} • {createdAt.toLocaleString()}
          </span>
        </span>
      </button>
      <button
        type="button"
        className="history-remove"
        onClick={() => onRemove(item.id)}
        aria-label={`Remove the video for ${item.prompt} from the library`}
      >
        &times;
      </button>
    </div>
  );
}
