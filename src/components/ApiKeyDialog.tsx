import { useState, type FormEvent } from 'react';

import { Modal } from './Modal';

interface ApiKeyDialogProps {
  onSubmit: (apiKey: string) => void;
  onClose: () => void;
  hasExistingKey: boolean;
}

export function ApiKeyDialog({ onSubmit, onClose, hasExistingKey }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const trimmed = apiKey.trim();
    if (trimmed) {
      onSubmit(trimmed);
      onClose();
    }
  };

  return (
    <Modal title="Connect your Google AI key" onClose={onClose} maxWidth={480}>
      <p className="panel-description" style={{ marginTop: 12, lineHeight: 1.5 }}>
        ClipGen.AI needs a Google AI API key to call the Veo models. The key stays in this browser tab
        (sessionStorage) and is never written to disk or sent to any server by this app.
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="api-key-input">
            API key
          </label>
          <input
            id="api-key-input"
            className="form-input"
            type="password"
            placeholder="AIza..."
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={!apiKey.trim()}>
          {hasExistingKey ? 'Replace the key' : 'Save the key'}
        </button>
      </form>

      <div className="auth-footer">
        <span>
          Need a key? Create one in Google AI Studio:{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
            aistudio.google.com/apikey
          </a>
        </span>
      </div>
    </Modal>
  );
}
