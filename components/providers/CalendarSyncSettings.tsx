'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface IntegrationStatus {
  connected: boolean;
  email?: string;
  url?: string;
  lastSynced?: string | null;
  error?: string | null;
  active?: boolean;
}

interface CalendarStatus {
  google: IntegrationStatus;
  ical: IntegrationStatus;
}

interface CalendarSyncSettingsProps {
  onSyncComplete?: () => void;
}

export default function CalendarSyncSettings({ onSyncComplete }: CalendarSyncSettingsProps) {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [icalUrl, setIcalUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [icalLoading, setIcalLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState<'google' | 'ical' | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Show success/error from OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const syncParam = params.get('sync');
    if (syncParam === 'google_success') {
      showNotification('success', 'Google Calendar succesvol gekoppeld!');
      fetchStatus();
    } else if (syncParam === 'error') {
      const msg = params.get('message') ?? 'Koppeling mislukt';
      showNotification('error', decodeURIComponent(msg));
    }
  }, [fetchStatus]);

  const handleConnectGoogle = () => {
    window.location.href = '/api/calendar/google/connect';
  };

  const handleDisconnect = async (type: 'google' | 'ical') => {
    setDisconnectLoading(type);
    try {
      const res = await fetch(
        type === 'google' ? '/api/calendar/google/disconnect' : '/api/calendar/ical',
        { method: 'DELETE' }
      );
      if (res.ok) {
        showNotification('success', `${type === 'google' ? 'Google Calendar' : 'iCalendar'} koppeling verwijderd`);
        await fetchStatus();
        onSyncComplete?.();
      } else {
        showNotification('error', 'Verwijderen mislukt');
      }
    } catch {
      showNotification('error', 'Verbindingsfout');
    } finally {
      setDisconnectLoading(null);
    }
  };

  const handleConnectIcal = async () => {
    if (!icalUrl.trim()) return;
    setIcalLoading(true);
    try {
      const res = await fetch('/api/calendar/ical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: icalUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', 'iCalendar gekoppeld en gesynchroniseerd!');
        setIcalUrl('');
        await fetchStatus();
        onSyncComplete?.();
      } else {
        showNotification('error', data.error ?? 'Koppeling mislukt');
      }
    } catch {
      showNotification('error', 'Verbindingsfout');
    } finally {
      setIcalLoading(false);
    }
  };

  const formatLastSynced = (lastSynced?: string | null) => {
    if (!lastSynced) return 'Nog niet gesynchroniseerd';
    try {
      return `Gesynchroniseerd ${formatDistanceToNow(new Date(lastSynced), { addSuffix: true, locale: nl })}`;
    } catch {
      return 'Onbekend';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-20 bg-gray-100 rounded-xl" />
        <div className="h-20 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notification && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Google Calendar */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <GoogleIcon />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-sm">Google Calendar</p>
              {status?.google.connected ? (
                <>
                  <p className="text-xs text-gray-500 truncate">{status.google.email}</p>
                  {status.google.error ? (
                    <p className="text-xs text-red-500 mt-0.5">{status.google.error}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">{formatLastSynced(status.google.lastSynced)}</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-400">Niet verbonden</p>
              )}
            </div>
          </div>
          <div className="shrink-0">
            {status?.google.connected ? (
              <button
                onClick={() => handleDisconnect('google')}
                disabled={disconnectLoading === 'google'}
                className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
              >
                {disconnectLoading === 'google' ? 'Bezig...' : 'Verbreek'}
              </button>
            ) : (
              <button
                onClick={handleConnectGoogle}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                Verbind
              </button>
            )}
          </div>
        </div>
      </div>

      {/* iCalendar */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
              <IcalIcon />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-sm">iCalendar (iOS / Outlook)</p>
              {status?.ical.connected ? (
                <>
                  <p className="text-xs text-gray-500 truncate max-w-[180px]">{status.ical.url}</p>
                  {status.ical.error ? (
                    <p className="text-xs text-red-500 mt-0.5">{status.ical.error}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">{formatLastSynced(status.ical.lastSynced)}</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-400">Niet verbonden</p>
              )}
            </div>
          </div>
          {status?.ical.connected && (
            <button
              onClick={() => handleDisconnect('ical')}
              disabled={disconnectLoading === 'ical'}
              className="shrink-0 text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
            >
              {disconnectLoading === 'ical' ? 'Bezig...' : 'Verbreek'}
            </button>
          )}
        </div>

        {!status?.ical.connected && (
          <div className="mt-3 flex gap-2">
            <input
              type="url"
              value={icalUrl}
              onChange={(e) => setIcalUrl(e.target.value)}
              placeholder="https://... (plak je iCal URL hier)"
              className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 min-w-0"
              onKeyDown={(e) => e.key === 'Enter' && handleConnectIcal()}
            />
            <button
              onClick={handleConnectIcal}
              disabled={icalLoading || !icalUrl.trim()}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 shrink-0"
            >
              {icalLoading ? 'Bezig...' : 'Koppel'}
            </button>
          </div>
        )}

        {!status?.ical.connected && (
          <p className="mt-2 text-xs text-gray-400">
            iPhone: Instellingen → Agenda → Accounts → iCloud → Deel agenda
          </p>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function IcalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
