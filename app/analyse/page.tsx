'use client';

import { useState, useEffect } from 'react';
import { Download, LogOut, Users, Briefcase, List } from 'lucide-react';

const ANALYSE_KEY = 'Equarqoune2005';

const CATEGORY_LABELS: Record<string, string> = {
  CATERING: 'Catering',
  MUSIC: 'Muziek / DJ',
  PHOTOGRAPHY: 'Fotografie',
  DECORATION: 'Decoratie',
  VENUE: 'Locatie',
  ENTERTAINMENT: 'Entertainment',
  VIDEOGRAPHY: 'Videografie',
  TRANSPORT: 'Transport',
  ACCOMMODATION: 'Accommodatie',
  SECURITY: 'Beveiliging',
  SANITARY: 'Sanitair',
  CAKE: 'Taart',
  FLOWERS: 'Bloemen',
  MC: 'MC',
  OTHER: 'Overige',
};

interface WaitlistEntry {
  id: string;
  type: string;
  name: string;
  email: string;
  phone: string | null;
  categories: string[];
  message: string | null;
  created_at: string;
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (username === 'Master' && password === 'Equarqoune2005') {
      sessionStorage.setItem('analyse_auth', '1');
      onLogin();
    } else {
      setError('Onjuiste gebruikersnaam of wachtwoord.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-gray-100 shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Analyse</h1>
        <p className="text-sm text-gray-500 mb-6">Toegang vereist</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gebruikersnaam</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 text-gray-900 focus:outline-none focus:border-purple-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Wachtwoord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 text-gray-900 focus:outline-none focus:border-purple-400 transition-colors"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
          >
            Inloggen
          </button>
        </form>
      </div>
    </div>
  );
}

function exportCSV(entries: WaitlistEntry[]) {
  const headers = ['Datum', 'Type', 'Naam', 'E-mail', 'Telefoon', 'Diensten', 'Bericht'];
  const rows = entries.map((e) => [
    new Date(e.created_at).toLocaleString('nl-BE'),
    e.type === 'CUSTOMER' ? 'Klant' : 'Dienstverlener',
    e.name,
    e.email,
    e.phone ?? '',
    e.categories.map((c) => CATEGORY_LABELS[c] ?? c).join(', '),
    e.message ?? '',
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `eventiphy-wachtlijst-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    fetch('/api/waitlist', { headers: { 'x-analyse-key': ANALYSE_KEY } })
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries ?? []);
        setLoading(false);
      })
      .catch(() => {
        setFetchError('Kon data niet laden.');
        setLoading(false);
      });
  }, []);

  const customers = entries.filter((e) => e.type === 'CUSTOMER');
  const providers = entries.filter((e) => e.type === 'PROVIDER');

  // Category frequency
  const categoryCounts: Record<string, number> = {};
  providers.forEach((p) => p.categories.forEach((c) => { categoryCounts[c] = (categoryCounts[c] ?? 0) + 1; }));
  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = sortedCategories[0]?.[1] ?? 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Eventiphy — Wachtlijst Analyse</h1>
          <p className="text-sm text-gray-500">{entries.length} aanmeldingen</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportCSV(entries)}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-xl border-2 border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Uitloggen
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {loading && <p className="text-gray-500 text-center py-12">Laden...</p>}
        {fetchError && <p className="text-red-600 text-center py-12">{fetchError}</p>}

        {!loading && !fetchError && (
          <>
            {/* Overzichtskaarten */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                    <List className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">Totaal</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{entries.length}</p>
              </div>
              <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">Klanten</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{customers.length}</p>
              </div>
              <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">Dienstverleners</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{providers.length}</p>
              </div>
            </div>

            {/* Categorieën grafiek */}
            {sortedCategories.length > 0 && (
              <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-5">Diensten — verdeling providers</h2>
                <div className="space-y-3">
                  {sortedCategories.map(([cat, count]) => (
                    <div key={cat} className="flex items-center gap-3">
                      <p className="text-sm text-gray-600 w-36 shrink-0">{CATEGORY_LABELS[cat] ?? cat}</p>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-700 transition-all"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm font-semibold text-gray-700 w-6 text-right">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data tabel */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Alle aanmeldingen</h2>
              </div>
              {entries.length === 0 ? (
                <p className="text-gray-500 text-center py-12">Nog geen aanmeldingen.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Datum', 'Type', 'Naam', 'E-mail', 'Telefoon', 'Diensten', 'Bericht'].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {new Date(entry.created_at).toLocaleDateString('nl-BE')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                              entry.type === 'CUSTOMER'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {entry.type === 'CUSTOMER' ? 'Klant' : 'Dienstverlener'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{entry.name}</td>
                          <td className="px-4 py-3 text-gray-600">{entry.email}</td>
                          <td className="px-4 py-3 text-gray-600">{entry.phone ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-600 max-w-48">
                            {entry.categories.length > 0
                              ? entry.categories.map((c) => CATEGORY_LABELS[c] ?? c).join(', ')
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-48 truncate">
                            {entry.message ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AnalysePage() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('analyse_auth') === '1') {
      setAuthed(true);
    }
    setChecked(true);
  }, []);

  function handleLogout() {
    sessionStorage.removeItem('analyse_auth');
    setAuthed(false);
  }

  if (!checked) return null;

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  return <Dashboard onLogout={handleLogout} />;
}
