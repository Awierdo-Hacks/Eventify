'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar as CalendarIcon,
  Lock,
  Unlock,
  Loader2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  BarChart3,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  addYears,
  subYears,
  format,
  isSameDay,
  isBefore,
  startOfDay,
  eachDayOfInterval,
  isWeekend,
  parse,
  formatDistanceToNow,
} from 'date-fns';
import { nl } from 'date-fns/locale';

interface BlockedDate {
  id: string;
  date: string;
  reason: string | null;
  createdAt: string;
}

interface BookedDate {
  date: string;
  bookingId: string;
  customerName: string;
  eventType: string | null;
}

interface ExternalEvent {
  date: string;
  title: string | null;
  source: 'GOOGLE' | 'ICAL' | string;
}

interface NextBooking {
  date: string;
  customerName: string;
  eventType: string | null;
}

interface BusiestMonth {
  month: string; // "2026-04"
  count: number;
}

interface SyncStatus {
  google: { connected: boolean; lastSynced?: string | null; error?: string | null };
  ical: { connected: boolean; lastSynced?: string | null; error?: string | null };
}

type DayStatus = 'available' | 'blocked' | 'booked' | 'external_google' | 'external_ical' | 'past';

export default function AgendaCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [bookedDates, setBookedDates] = useState<BookedDate[]>([]);
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [nextBooking, setNextBooking] = useState<NextBooking | null>(null);
  const [busiestMonth, setBusiestMonth] = useState<BusiestMonth | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchSyncStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar/status');
      if (res.ok) setSyncStatus(await res.json());
    } catch {
      // Non-critical
    }
  }, []);

  const fetchData = useCallback(async (month: Date) => {
    setLoadError(null);
    try {
      const from = startOfMonth(month).toISOString().split('T')[0];
      const to = endOfMonth(addMonths(month, 1)).toISOString().split('T')[0];

      const res = await fetch(`/api/providers/me/blocked-dates?from=${from}&to=${to}`, {
        credentials: 'same-origin',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || `Server fout (${res.status})`);
      }

      const data = await res.json();
      setBlockedDates(data.blockedDates || []);
      setBookedDates(data.bookedDates || []);
      setExternalEvents(data.externalEvents || []);
      setNextBooking(data.nextBooking || null);
      setBusiestMonth(data.busiestMonth || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Netwerk fout — controleer je verbinding';
      console.error('Agenda fetch error:', err);
      setLoadError(message);
      showNotification('error', message);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: fetch status, trigger background sync, then load calendar data
  useEffect(() => {
    fetchSyncStatus();
    // Trigger auto-sync (respects cooldown server-side)
    fetch('/api/calendar/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force: false }),
    }).then(() => {
      fetchData(currentMonth);
      fetchSyncStatus();
    }).catch(() => fetchData(currentMonth));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) fetchData(currentMonth);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      const data = await res.json();
      if (data.synced > 0) {
        showNotification('success', `${data.synced} agenda${data.synced > 1 ? "'s" : ''} gesynchroniseerd`);
        await fetchData(currentMonth);
        await fetchSyncStatus();
      } else {
        showNotification('success', 'Agenda is up-to-date');
      }
    } catch {
      showNotification('error', 'Sync mislukt');
    } finally {
      setSyncing(false);
    }
  };

  const blockedDateObjects = useMemo(
    () => blockedDates.map((d) => new Date(d.date + 'T00:00:00')),
    [blockedDates]
  );
  const bookedDateObjects = useMemo(
    () => bookedDates.map((d) => new Date(d.date + 'T00:00:00')),
    [bookedDates]
  );
  const googleDateObjects = useMemo(
    () => externalEvents.filter((e) => e.source === 'GOOGLE').map((e) => new Date(e.date + 'T00:00:00')),
    [externalEvents]
  );
  const icalDateObjects = useMemo(
    () => externalEvents.filter((e) => e.source === 'ICAL').map((e) => new Date(e.date + 'T00:00:00')),
    [externalEvents]
  );

  const getDayStatus = useCallback(
    (date: Date): DayStatus => {
      if (isBefore(date, startOfDay(new Date()))) return 'past';
      if (bookedDateObjects.some((bd) => isSameDay(bd, date))) return 'booked';
      if (blockedDateObjects.some((bd) => isSameDay(bd, date))) return 'blocked';
      if (googleDateObjects.some((bd) => isSameDay(bd, date))) return 'external_google';
      if (icalDateObjects.some((bd) => isSameDay(bd, date))) return 'external_ical';
      return 'available';
    },
    [blockedDateObjects, bookedDateObjects, googleDateObjects, icalDateObjects]
  );

  const selectedDayInfo = useMemo(() => {
    if (!selectedDate) return null;
    const status = getDayStatus(selectedDate);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const blocked = blockedDates.find((d) => d.date === dateStr);
    const booked = bookedDates.find((d) => d.date === dateStr);
    const external = externalEvents.find((e) => e.date === dateStr);
    return { status, blocked, booked, external };
  }, [selectedDate, getDayStatus, blockedDates, bookedDates, externalEvents]);

  // === Maand statistieken ===
  const monthStats = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const workDays = allDays.filter((d) => !isWeekend(d));
    const totalDays = allDays.length;
    const totalWorkDays = workDays.length;

    const bookedCount = allDays.filter((d) =>
      bookedDateObjects.some((bd) => isSameDay(bd, d))
    ).length;

    const blockedCount = allDays.filter((d) =>
      blockedDateObjects.some((bd) => isSameDay(bd, d))
    ).length;

    const googleCount = allDays.filter((d) =>
      googleDateObjects.some((bd) => isSameDay(bd, d))
    ).length;

    const icalCount = allDays.filter((d) =>
      icalDateObjects.some((bd) => isSameDay(bd, d))
    ).length;

    const unavailableCount = new Set([
      ...bookedDates.map((d) => d.date),
      ...blockedDates.map((d) => d.date),
      ...externalEvents.map((e) => e.date),
    ]).size;

    const availableCount = Math.max(0, totalDays - unavailableCount);

    const occupancyRate = totalWorkDays > 0
      ? Math.round((bookedCount / totalWorkDays) * 100)
      : 0;

    const freeDays = availableCount;

    return {
      totalDays,
      totalWorkDays,
      bookedCount,
      blockedCount,
      googleCount,
      icalCount,
      availableCount,
      occupancyRate,
      freeDays,
    };
  }, [currentMonth, blockedDateObjects, bookedDateObjects, googleDateObjects, icalDateObjects, blockedDates, bookedDates, externalEvents]);

  // === Acties ===
  const handleBlockDate = async (date: Date, reason?: string) => {
    setSaving(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await fetch('/api/providers/me/blocked-dates', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates: [dateStr], reason: reason || undefined }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Fout');
      }
      showNotification('success', `${format(date, 'd MMMM', { locale: nl })} niet beschikbaar gezet`);
      setBlockReason('');
      await fetchData(currentMonth);
    } catch (err) {
      console.error('Block date error:', err);
      showNotification('error', err instanceof Error ? err.message : 'Kon status niet wijzigen');
    } finally {
      setSaving(false);
    }
  };

  const handleUnblockDate = async (date: Date) => {
    setSaving(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await fetch('/api/providers/me/blocked-dates', {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates: [dateStr] }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Fout');
      }
      showNotification('success', `${format(date, 'd MMMM', { locale: nl })} weer beschikbaar`);
      await fetchData(currentMonth);
    } catch (err) {
      console.error('Unblock date error:', err);
      showNotification('error', err instanceof Error ? err.message : 'Kon status niet wijzigen');
    } finally {
      setSaving(false);
    }
  };

  // Kalender modifiers
  const calendarModifiers = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const today = startOfDay(new Date());
    const allExternalDates = [...googleDateObjects, ...icalDateObjects];

    return {
      blocked: blockedDateObjects,
      booked: bookedDateObjects,
      external_google: googleDateObjects,
      external_ical: icalDateObjects,
      available: eachDayOfInterval({ start: monthStart, end: monthEnd }).filter(
        (d) =>
          !isBefore(d, today) &&
          !blockedDateObjects.some((bd) => isSameDay(bd, d)) &&
          !bookedDateObjects.some((bd) => isSameDay(bd, d)) &&
          !allExternalDates.some((bd) => isSameDay(bd, d))
      ),
    };
  }, [currentMonth, blockedDateObjects, bookedDateObjects, googleDateObjects, icalDateObjects]);

  // Navigatie
  const goToPrevMonth = () => setCurrentMonth((m) => subMonths(m, 1));
  const goToNextMonth = () => setCurrentMonth((m) => addMonths(m, 1));
  const goToPrevYear = () => setCurrentMonth((m) => subYears(m, 1));
  const goToNextYear = () => setCurrentMonth((m) => addYears(m, 1));
  const goToToday = () => setCurrentMonth(new Date());

  // Drukste maand label
  const busiestMonthLabel = useMemo(() => {
    if (!busiestMonth) return null;
    try {
      const d = parse(busiestMonth.month + '-01', 'yyyy-MM-dd', new Date());
      return `${format(d, 'MMMM yyyy', { locale: nl })} (${busiestMonth.count})`;
    } catch {
      return null;
    }
  }, [busiestMonth]);

  // Last sync label
  const lastSyncedLabel = useMemo(() => {
    const dates = [syncStatus?.google?.lastSynced, syncStatus?.ical?.lastSynced]
      .filter(Boolean)
      .map((d) => new Date(d!));
    if (dates.length === 0) return null;
    const latest = dates.reduce((a, b) => (a > b ? a : b));
    try {
      return formatDistanceToNow(latest, { addSuffix: true, locale: nl });
    } catch {
      return null;
    }
  }, [syncStatus]);

  const hasExternalIntegration = syncStatus &&
    (syncStatus.google?.connected || syncStatus.ical?.connected);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-80 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl lg:col-span-2" />
      </div>
    );
  }

  if (loadError && blockedDates.length === 0 && bookedDates.length === 0) {
    return (
      <Card className="p-8 border-2 border-red-100 rounded-3xl text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Kon agenda niet laden</h3>
        <p className="text-sm text-gray-500 mb-4">{loadError}</p>
        <Button
          onClick={() => { setLoading(true); fetchData(currentMonth); }}
          className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Opnieuw proberen
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notificatie */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl flex items-center gap-3 ${
              notification.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hoofd layout: Stats links + Agenda rechts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* === STATS PANEL === */}
        <div className="space-y-4 lg:col-span-1">
          {/* Bezettingsgraad */}
          <Card className="p-5 border-2 border-gray-100 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900 text-sm">
                {format(currentMonth, 'MMMM yyyy', { locale: nl })}
              </h4>
            </div>

            <div className="flex justify-center mb-4">
              <div className="relative w-28 h-28">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={monthStats.occupancyRate >= 70 ? '#22c55e' : monthStats.occupancyRate >= 40 ? '#f59e0b' : '#9333ea'}
                    strokeWidth="10"
                    strokeDasharray={`${(monthStats.occupancyRate / 100) * 314} 314`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{monthStats.occupancyRate}%</span>
                  <span className="text-[10px] text-gray-500">bezetting</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-sm text-gray-600">Beschikbaar</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{monthStats.availableCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="text-sm text-gray-600">Geboekt</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{monthStats.bookedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-sm text-gray-600">Manueel geblokkeerd</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{monthStats.blockedCount}</span>
              </div>
              {monthStats.googleCount > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-400" />
                    <span className="text-sm text-gray-600">Google Calendar</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{monthStats.googleCount}</span>
                </div>
              )}
              {monthStats.icalCount > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-400" />
                    <span className="text-sm text-gray-600">iCalendar</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{monthStats.icalCount}</span>
                </div>
              )}
            </div>

            <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden flex">
              {monthStats.totalDays > 0 && (
                <>
                  <div
                    className="h-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${(monthStats.bookedCount / monthStats.totalDays) * 100}%` }}
                  />
                  <div
                    className="h-full bg-red-400 transition-all duration-500"
                    style={{ width: `${(monthStats.blockedCount / monthStats.totalDays) * 100}%` }}
                  />
                  <div
                    className="h-full bg-blue-400 transition-all duration-500"
                    style={{ width: `${(monthStats.googleCount / monthStats.totalDays) * 100}%` }}
                  />
                  <div
                    className="h-full bg-purple-400 transition-all duration-500"
                    style={{ width: `${(monthStats.icalCount / monthStats.totalDays) * 100}%` }}
                  />
                  <div
                    className="h-full bg-green-200 transition-all duration-500"
                    style={{ width: `${(monthStats.availableCount / monthStats.totalDays) * 100}%` }}
                  />
                </>
              )}
            </div>
          </Card>

          {/* Volgende boeking */}
          <Card className="p-5 border-2 border-gray-100 rounded-3xl">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-amber-500" />
              <h4 className="font-semibold text-gray-900 text-sm">Volgende boeking</h4>
            </div>
            {nextBooking ? (
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {format(new Date(nextBooking.date + 'T00:00:00'), 'd MMMM yyyy', { locale: nl })}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {nextBooking.customerName}
                  {nextBooking.eventType && (
                    <span className="text-purple-600"> · {nextBooking.eventType}</span>
                  )}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Geen aankomende boekingen</p>
            )}
          </Card>

          {/* Inzichten */}
          <Card className="p-5 border-2 border-gray-100 rounded-3xl">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h4 className="font-semibold text-gray-900 text-sm">Inzichten</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Werkdagen</span>
                <span className="text-sm font-semibold text-gray-900">{monthStats.totalWorkDays}</span>
              </div>
              {busiestMonthLabel && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Drukste maand</span>
                  <span className="text-sm font-semibold text-gray-900 text-right">{busiestMonthLabel}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Vrije dagen</span>
                <span className="text-sm font-semibold text-gray-900">{monthStats.freeDays}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* === AGENDA CARD === */}
        <Card className="p-4 sm:p-6 border-2 border-gray-100 rounded-3xl lg:col-span-2">
          {/* Header met navigatie */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Agenda</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={goToPrevYear}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                title="Vorig jaar"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToPrevMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                title="Vorige maand"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 rounded-lg hover:bg-purple-50 text-sm font-medium text-purple-600 transition-colors"
              >
                Vandaag
              </button>
              <button
                onClick={goToNextMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                title="Volgende maand"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={goToNextYear}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                title="Volgend jaar"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sync-banner (only if integrations exist) */}
          {hasExternalIntegration && (
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs text-gray-400">
                {lastSyncedLabel ? `Gesynchroniseerd ${lastSyncedLabel}` : 'Nog niet gesynchroniseerd'}
              </span>
              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Bezig...' : 'Sync nu'}
              </button>
            </div>
          )}

          {/* Kalender + dag detail naast elkaar */}
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Kalender */}
            <div className="flex-shrink-0">
              <Calendar
                mode="single"
                selected={selectedDate ?? undefined}
                onSelect={(date) => setSelectedDate(date ?? null)}
                onMonthChange={setCurrentMonth}
                month={currentMonth}
                modifiers={calendarModifiers}
                modifiersClassNames={{
                  blocked: '!bg-red-100 !text-red-600 !font-semibold hover:!bg-red-200',
                  booked: '!bg-amber-100 !text-amber-700 !font-semibold hover:!bg-amber-200',
                  external_google: '!bg-blue-100 !text-blue-700 !font-semibold hover:!bg-blue-200',
                  external_ical: '!bg-purple-100 !text-purple-700 !font-semibold hover:!bg-purple-200',
                  available: '!bg-green-50 hover:!bg-green-100',
                }}
              />

              {/* Legenda */}
              <div className="flex flex-wrap gap-3 mt-3 justify-center text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300" />
                  <span className="text-gray-500">Beschikbaar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300" />
                  <span className="text-gray-500">Geboekt</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300" />
                  <span className="text-gray-500">Geblokkeerd</span>
                </div>
                {(syncStatus?.google?.connected || monthStats.googleCount > 0) && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300" />
                    <span className="text-gray-500">Google Calendar</span>
                  </div>
                )}
                {(syncStatus?.ical?.connected || monthStats.icalCount > 0) && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-purple-100 border border-purple-300" />
                    <span className="text-gray-500">iCalendar</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dag detail panel */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {selectedDate && selectedDayInfo ? (
                  <motion.div
                    key={selectedDate.toISOString()}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="h-full"
                  >
                    <div className="p-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 h-full flex flex-col">
                      <div className="mb-3">
                        <p className="font-bold text-gray-900">
                          {format(selectedDate, 'EEEE', { locale: nl })}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {format(selectedDate, 'd MMMM yyyy', { locale: nl })}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              selectedDayInfo.status === 'available'
                                ? 'bg-green-400'
                                : selectedDayInfo.status === 'booked'
                                ? 'bg-amber-400'
                                : selectedDayInfo.status === 'blocked'
                                ? 'bg-red-400'
                                : selectedDayInfo.status === 'external_google'
                                ? 'bg-blue-400'
                                : selectedDayInfo.status === 'external_ical'
                                ? 'bg-purple-400'
                                : 'bg-gray-300'
                            }`}
                          />
                          <span className="text-sm text-gray-500">
                            {selectedDayInfo.status === 'available' && 'Beschikbaar'}
                            {selectedDayInfo.status === 'booked' && 'Geboekt'}
                            {selectedDayInfo.status === 'blocked' && 'Niet beschikbaar (manueel)'}
                            {selectedDayInfo.status === 'external_google' && 'Bezet via Google Calendar'}
                            {selectedDayInfo.status === 'external_ical' && 'Bezet via iCalendar'}
                            {selectedDayInfo.status === 'past' && 'Verlopen'}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        {selectedDayInfo.status === 'available' && (
                          <div className="space-y-2">
                            <Input
                              placeholder="Reden (optioneel)"
                              value={blockReason}
                              onChange={(e) => setBlockReason(e.target.value)}
                              className="border-2 border-gray-200 rounded-xl h-10 text-sm"
                            />
                            <Button
                              onClick={() => {
                                if (selectedDate) handleBlockDate(selectedDate, blockReason);
                              }}
                              disabled={saving}
                              className="w-full rounded-xl border-2 border-red-300 text-red-700 bg-white hover:bg-red-50 font-medium h-10 text-sm"
                              variant="outline"
                            >
                              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                              Niet beschikbaar zetten
                            </Button>
                          </div>
                        )}

                        {selectedDayInfo.status === 'blocked' && (
                          <div className="space-y-2">
                            {selectedDayInfo.blocked?.reason && (
                              <p className="text-sm text-gray-500">
                                Reden: <span className="text-gray-700 font-medium">{selectedDayInfo.blocked.reason}</span>
                              </p>
                            )}
                            <Button
                              onClick={() => {
                                if (selectedDate) handleUnblockDate(selectedDate);
                              }}
                              disabled={saving}
                              className="w-full rounded-xl border-2 border-green-300 text-green-700 bg-white hover:bg-green-50 font-medium h-10 text-sm"
                              variant="outline"
                            >
                              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unlock className="w-4 h-4 mr-2" />}
                              Beschikbaar maken
                            </Button>
                          </div>
                        )}

                        {(selectedDayInfo.status === 'external_google' || selectedDayInfo.status === 'external_ical') && (
                          <div className="space-y-1.5">
                            {selectedDayInfo.external?.title && (
                              <p className="text-sm text-gray-700">
                                <span className="text-gray-500">Agendaitem:</span>{' '}
                                <span className="font-medium">{selectedDayInfo.external.title}</span>
                              </p>
                            )}
                            <p className="text-sm text-gray-500">
                              Bron:{' '}
                              <span className={`font-medium ${selectedDayInfo.status === 'external_google' ? 'text-blue-600' : 'text-purple-600'}`}>
                                {selectedDayInfo.status === 'external_google' ? 'Google Calendar' : 'iCalendar'}
                              </span>
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              Bewerk dit event in je externe agenda om de beschikbaarheid te wijzigen.
                            </p>
                          </div>
                        )}

                        {selectedDayInfo.status === 'booked' && selectedDayInfo.booked && (
                          <div className="space-y-1.5">
                            <p className="text-sm text-gray-700">
                              <span className="text-gray-500">Klant:</span>{' '}
                              <span className="font-medium">{selectedDayInfo.booked.customerName}</span>
                            </p>
                            {selectedDayInfo.booked.eventType && (
                              <p className="text-sm text-gray-700">
                                <span className="text-gray-500">Type:</span>{' '}
                                <span className="font-medium">{selectedDayInfo.booked.eventType}</span>
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              Status kan niet gewijzigd worden.
                            </p>
                          </div>
                        )}

                        {selectedDayInfo.status === 'past' && (
                          <p className="text-sm text-gray-400">
                            Verlopen datums kunnen niet gewijzigd worden.
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex items-center justify-center p-4 rounded-2xl border-2 border-dashed border-gray-200"
                  >
                    <p className="text-sm text-gray-400 text-center">
                      Selecteer een datum om de status te bekijken of te wijzigen.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
