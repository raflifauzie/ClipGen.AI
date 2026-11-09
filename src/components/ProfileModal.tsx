import { useState, type FormEvent } from 'react';

import type { LocalProfile } from '../types';
import { Modal } from './Modal';

interface ProfileModalProps {
  profile: LocalProfile;
  onSave: (profile: LocalProfile) => void;
  onClose: () => void;
}

export function ProfileModal({ profile, onSave, onClose }: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [email, setEmail] = useState(profile.email);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSave({ displayName: displayName.trim(), email: email.trim() });
    onClose();
  };

  return (
    <Modal title="Local profile" onClose={onClose} maxWidth={400}>
      <p className="panel-description" style={{ marginBottom: 16 }}>
        This is a profile stored on this device only. It is not a sign-in: there is no account server yet, so no
        password is needed and nothing is sent anywhere.
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="profile-name">
            Display name
          </label>
          <input
            id="profile-name"
            className="form-input"
            placeholder="Your name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={60}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="profile-email">
            Email
          </label>
          <input
            id="profile-email"
            className="form-input"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={120}
          />
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
          Save profile
        </button>
      </form>

      <div className="auth-footer">
        <span>Sign-in with a real account needs a backend. This build works with a local profile only.</span>
      </div>
    </Modal>
  );
}
