'use client';

import { useState } from 'react';
import type { PassengerProfile } from '@/types';
import { savePassengerProfile } from '@/lib/profiles';

interface EditPassengerModalProps {
  isOpen: boolean;
  profile: PassengerProfile;
  onClose: () => void;
  onSuccess: (updatedProfile: PassengerProfile) => void;
}

export default function EditPassengerModal({
  isOpen,
  profile,
  onClose,
  onSuccess,
}: EditPassengerModalProps) {
  const [name, setName] = useState(profile.name || '');
  const [emergencyName, setEmergencyName] = useState(profile.emergency_contact_name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(profile.emergency_contact_phone || '');
  const [healthText, setHealthText] = useState((profile.health_conditions || []).join(', '));
  const [disabilityText, setDisabilityText] = useState((profile.disabilities || []).join(', '));
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updated: PassengerProfile = {
      ...profile,
      name: name.trim() || profile.passenger_id,
      emergency_contact_name: emergencyName.trim(),
      emergency_contact_phone: emergencyPhone.trim(),
      health_conditions: healthText
        ? healthText.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      disabilities: disabilityText
        ? disabilityText.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    };

    try {
      await savePassengerProfile(updated);
      onSuccess(updated);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: 'var(--color-paper-raised)', border: '1px solid var(--color-rule)',
          borderRadius: 'var(--radius-lg)', padding: 24, width: '100%', maxWidth: 440,
          boxShadow: 'var(--shadow-lg)', color: 'var(--color-ink)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>
            Edit Passenger Card
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--color-ink-faint)', fontSize: 20, cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Passenger Name */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)', marginBottom: 4 }}>
              PASSENGER NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              style={{
                width: '100%', padding: '10px 12px', background: 'var(--color-paper)',
                border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-sm)',
                color: 'var(--color-ink)', fontSize: 'var(--text-sm)', outline: 'none',
              }}
            />
          </div>

          {/* Emergency Contact Name */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)', marginBottom: 4 }}>
              EMERGENCY CONTACT NAME
            </label>
            <input
              type="text"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              placeholder="e.g., Brother, Spouse, Next of Kin"
              style={{
                width: '100%', padding: '10px 12px', background: 'var(--color-paper)',
                border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-sm)',
                color: 'var(--color-ink)', fontSize: 'var(--text-sm)', outline: 'none',
              }}
            />
          </div>

          {/* Emergency Contact Phone */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)', marginBottom: 4 }}>
              EMERGENCY CONTACT PHONE
            </label>
            <input
              type="text"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="+234 803 000 0000"
              style={{
                width: '100%', padding: '10px 12px', background: 'var(--color-paper)',
                border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-sm)',
                color: 'var(--color-ink)', fontSize: 'var(--text-sm)', outline: 'none',
              }}
            />
          </div>

          {/* Health Conditions */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)', marginBottom: 4 }}>
              HEALTH CONDITIONS (comma-separated)
            </label>
            <input
              type="text"
              value={healthText}
              onChange={(e) => setHealthText(e.target.value)}
              placeholder="e.g., Asthma, Hypertension (or leave blank)"
              style={{
                width: '100%', padding: '10px 12px', background: 'var(--color-paper)',
                border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-sm)',
                color: 'var(--color-ink)', fontSize: 'var(--text-sm)', outline: 'none',
              }}
            />
          </div>

          {/* Accessibility Needs */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)', marginBottom: 4 }}>
              ACCESSIBILITY / DISABILITIES (comma-separated)
            </label>
            <input
              type="text"
              value={disabilityText}
              onChange={(e) => setDisabilityText(e.target.value)}
              placeholder="e.g., Hearing Impaired, Wheelchair (or leave blank)"
              style={{
                width: '100%', padding: '10px 12px', background: 'var(--color-paper)',
                border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-sm)',
                color: 'var(--color-ink)', fontSize: 'var(--text-sm)', outline: 'none',
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px', background: 'transparent', color: 'var(--color-ink-muted)',
                border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '9px 20px', background: 'var(--color-accent)', color: 'var(--color-paper)',
                border: 'none', borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', cursor: 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
