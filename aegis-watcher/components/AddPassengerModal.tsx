'use client';

import { useState } from 'react';

interface AddPassengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPassengerModal({ isOpen, onClose, onSuccess }: AddPassengerModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/pairing/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add passenger');
      }

      onSuccess();
      onClose();
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add passenger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--color-paper-raised)', borderRadius: 'var(--radius-lg)',
        padding: '24px', width: '100%', maxWidth: '400px',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600 }}>
          Add Passenger
        </h2>
        
        <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-ink-muted)' }}>
          Enter the 6-digit pairing code from the passenger app to start monitoring them.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: 'var(--color-ink)' }}>
              Pairing Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              style={{
                width: '100%', padding: '10px 12px',
                border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-lg)',
                fontSize: 16, fontWeight: 600, letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 12px',
              background: 'var(--color-danger-dim)', color: 'var(--color-danger)',
              borderRadius: 'var(--radius-lg)', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 20px', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-rule)', background: 'var(--color-paper-raised)',
                fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              style={{
                padding: '10px 20px', borderRadius: 'var(--radius-lg)',
                border: 'none', background: 'var(--color-safe)', color: 'var(--color-paper-raised)',
                fontSize: 14, fontWeight: 600, cursor: loading || code.length !== 6 ? 'not-allowed' : 'pointer',
                opacity: loading || code.length !== 6 ? 0.6 : 1,
              }}
            >
              {loading ? 'Adding...' : 'Add Passenger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
