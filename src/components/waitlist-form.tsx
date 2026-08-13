'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [website, setWebsite] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      const timestamp = Date.now();
      const signature = btoa(`${email}:${timestamp}:HELMDASH`);

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, _hp_email: botField }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'inscription");
      }

      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 14, color: "#3FB27F", background: "rgba(63,178,127,0.1)", padding: "12px 20px", borderRadius: 8, border: "1px solid rgba(63,178,127,0.2)", display: "inline-block" }}>
        ✓ Inscription confirmée. À très vite !
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 360 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          name="_hp_email"
          style={{ display: 'none' }}
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
        <input
          type="email"
          placeholder="Entrez votre email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 8,
            border: "1px solid rgba(14,27,46,0.2)",
            background: "#F5F1E8",
            color: "#0E1B2E",
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#F0522E",
            color: "#0E1B2E",
            border: "none",
            borderRadius: 8,
            padding: "0 20px",
            fontFamily: '"IBM Plex Mono", monospace',
            fontWeight: 600,
            fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s"
          }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join the waitlist"}
        </button>
      </div>
      {error && (
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, color: "#F0522E" }}>{error}</span>
      )}
    </form>
  );
}
