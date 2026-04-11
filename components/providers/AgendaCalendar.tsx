'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
} from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  format,
  isSameDay,
  isSameMonth,
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

type DayEventKind = 'booked' | 'blocked' | 'google' | 'ical';
interface DayEvent {
  kind: DayEventKind;
  title: string | null;
}

const WEEKDAY_LABELS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const MOBILE_WEEKDAY_LABELS = ['M', 'D', 'W', 'D', 'V', 'Z', 'Z'];

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

  const getEventsForDay = useCallback(
    (date: Date): DayEvent[] => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const events: DayEvent[] = [];

      const booked = bookedDates.find((d) => d.date === dateStr);
      if (booked) {
        events.push({
          kind: 'booked',
          title: booked.eventType
            ? `${booked.eventType} · ${booked.customerName}`
            : booked.customerName,
        });
      }

      const blocked = blockedDates.find((d) => d.date === dateStr);
      if (blocked) {
        events.push({ kind: 'blocked', title: blocked.reason || 'Niet beschikbaar' });
      }

      for (const ext of externalEvents) {
        if (ext.date !== dateStr) continue;
        events.push({
          kind: ext.source === 'GOOGLE' ? 'google' : 'ical',
          title: ext.title,
        });
      }

      return events;
    },
    [bookedDates, blockedDates, externalEvents]
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

  // === Maand grid (6 rows × 7 cols, Monday-first) ===
  const monthGrid = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const gridEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
    return days.map((date) => ({
      date,
      isCurrentMonth: isSameMonth(date, currentMonth),
    }));
  }, [currentMonth]);

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

  // Navigatie
  const goToPrevMonth = () => setCurrentMonth((m) => subMonths(m, 1));
  const goToNextMonth = () => setCurrentMonth((m) => addMonths(m, 1));
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
      <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-6">
        <Skeleton className="h-80 rounded-3xl" />
        <Skeleton className="h-[32rem] rounded-3xl" />
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

  // ========= Sub-components (closure over state) =========

  const OccupancyCard = () => (
    <Card className="p-5 border-2 border-gray-100 rounded-3xl bg-white">
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
            <span className="text-sm text-gray-600">Niet beschikbaar</span>
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
  );

  const NextBookingCard = () => (
    <Card className="p-5 border-2 border-gray-100 rounded-3xl bg-white">
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
  );

  const InsightsCard = () => (
    <Card className="p-5 border-2 border-gray-100 rounded-3xl bg-white">
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
  );

  const MonthTitle = () => (
    <div className="flex items-center gap-3">
      <CalendarIcon className="w-6 h-6 text-purple-600" />
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 capitalize">
        {format(currentMonth, 'MMMM yyyy', { locale: nl })}
      </h3>
    </div>
  );

  const NavButtons = () => (
    <div className="flex items-center gap-1">
      <button
        onClick={goToToday}
        className="px-3 py-1 rounded-lg hover:bg-purple-50 text-sm font-medium text-purple-600 transition-colors"
      >
        Vandaag
      </button>
      <button
        onClick={goToPrevMonth}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        title="Vorige maand"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={goToNextMonth}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        title="Volgende maand"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );

  const SyncButton = ({ compact = false }: { compact?: boolean }) => (
    <button
      onClick={handleManualSync}
      disabled={syncing}
      className={`flex items-center gap-2 border-2 border-gray-200 bg-white rounded-xl ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'} font-medium text-gray-700 hover:border-purple-300 hover:text-purple-700 transition-colors disabled:opacity-50`}
    >
      <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Bezig...' : 'Sync Calendar'}
    </button>
  );

  // Cell styling helpers
  const statusBorderClass = (status: DayStatus): string => {
    switch (status) {
      case 'available':
        return 'border-l-[3px] border-l-green-400';
      case 'booked':
        return 'border-l-[3px] border-l-amber-400 bg-amber-50/40';
      case 'blocked':
        return 'border-l-[3px] border-l-red-400 bg-red-50/40';
      case 'external_google':
        return 'border-l-[3px] border-l-blue-400 bg-blue-50/40';
      case 'external_ical':
        return 'border-l-[3px] border-l-purple-400 bg-purple-50/40';
      default:
        return 'border-l-[3px] border-l-gray-200';
    }
  };

  const eventBlockClass = (kind: DayEventKind): string => {
    switch (kind) {
      case 'booked':
        return 'bg-amber-100 border-l-2 border-amber-500 text-amber-900';
      case 'blocked':
        return 'bg-red-100 border-l-2 border-red-500 text-red-900';
      case 'google':
        return 'bg-blue-100 border-l-2 border-blue-500 text-blue-900';
      case 'ical':
        return 'bg-purple-100 border-l-2 border-purple-500 text-purple-900';
    }
  };

  const mobileDotClass = (kind: DayEventKind): string => {
    switch (kind) {
      case 'booked':
        return 'bg-amber-400';
      case 'blocked':
        return 'bg-red-400';
      case 'google':
        return 'bg-blue-400';
      case 'ical':
        return 'bg-purple-400';
    }
  };

  const Legend = () => (
    <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600 px-1">
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-green-400" />
        Beschikbaar
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-amber-400" />
        Geboekt
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        Niet beschikbaar
      </div>
      {(syncStatus?.google?.connected || monthStats.googleCount > 0) && (
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-400" />
          Google
        </div>
      )}
      {(syncStatus?.ical?.connected || monthStats.icalCount > 0) && (
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-400" />
          iCal
        </div>
      )}
    </div>
  );

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

      {/* ================= DESKTOP LAYOUT ================= */}
      <div className="hidden lg:grid lg:grid-cols-[18rem_1fr] gap-6">
        {/* Sidebar */}
        <aside className="space-y-4">
          <OccupancyCard />
          <NextBookingCard />
          <InsightsCard />
        </aside>

        {/* Calendar card */}
        <Card className="p-6 border-2 border-gray-100 rounded-3xl bg-white flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <MonthTitle />
            <div className="flex items-center gap-3">
              <SyncButton />
              <div className="w-px h-6 bg-gray-200" />
              <NavButtons />
            </div>
          </div>

          {/* Sync micro-label */}
          {hasExternalIntegration && (
            <div className="flex items-center justify-end mb-2 px-1">
              <span className="text-xs text-gray-400">
                {lastSyncedLabel ? `Gesynchroniseerd ${lastSyncedLabel}` : 'Nog niet gesynchroniseerd'}
              </span>
            </div>
          )}

          {/* Month grid */}
          <div className="flex-1 border border-gray-200 rounded-2xl overflow-hidden flex flex-col bg-white">
            {/* Weekday header */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 grid-rows-6 flex-1">
              {monthGrid.map((cell, idx) => {
                const status = getDayStatus(cell.date);
                const events = getEventsForDay(cell.date);
                const isPast = status === 'past';
                const inMonth = cell.isCurrentMonth;
                const rowEnd = Math.floor(idx / 7) === 5;
                const colEnd = (idx + 1) % 7 === 0;

                return (
                  <button
                    key={cell.date.toISOString()}
                    type="button"
                    onClick={() => setSelectedDate(cell.date)}
                    className={`group relative text-left min-h-[110px] p-2 bg-white hover:bg-gray-50/60 transition-colors
                      ${colEnd ? '' : 'border-r border-gray-200'}
                      ${rowEnd ? '' : 'border-b border-gray-200'}
                      ${inMonth ? statusBorderClass(status) : 'border-l-[3px] border-l-transparent opacity-40'}
                      ${isPast ? 'opacity-60' : ''}
                    `}
                  >
                    {/* Date number */}
                    <span
                      className={`absolute top-2 right-2 text-sm font-medium ${
                        inMonth ? 'text-gray-700' : 'text-gray-300'
                      }`}
                    >
                      {format(cell.date, 'd')}
                    </span>

                    {/* Events */}
                    {inMonth && events.length > 0 && (
                      <div className="mt-6 space-y-1">
                        {events.slice(0, 2).map((event, i) => (
                          <div
                            key={i}
                            className={`p-1.5 rounded text-[11px] leading-tight shadow-sm relative overflow-hidden ${eventBlockClass(event.kind)}`}
                          >
                            <div className="truncate pr-5">
                              {event.title || (event.kind === 'blocked' ? 'Niet beschikbaar' : 'Event')}
                            </div>
                            {event.kind === 'google' && (
                              <span className="absolute top-0.5 right-1 text-[9px] font-bold text-blue-700">
                                G
                              </span>
                            )}
                            {event.kind === 'ical' && (
                              <span className="absolute top-0 right-0 text-[9px] bg-purple-500 text-white px-1 rounded-bl">
                                ical
                              </span>
                            )}
                          </div>
                        ))}
                        {events.length > 2 && (
                          <div className="text-[10px] text-gray-500 font-medium px-1">
                            +{events.length - 2} meer
                          </div>
                        )}
                      </div>
                    )}

                    {/* Hover quick-action */}
                    {inMonth && !isPast && (status === 'available' || status === 'blocked') && (
                      <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (status === 'available') {
                              handleBlockDate(cell.date);
                            } else {
                              handleUnblockDate(cell.date);
                            }
                          }}
                          role="button"
                          tabIndex={-1}
                          className={`w-full text-center py-1 rounded text-[10px] font-bold shadow-sm border cursor-pointer ${
                            status === 'available'
                              ? 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                              : 'bg-white text-green-600 border-green-200 hover:bg-green-50'
                          }`}
                        >
                          {status === 'available' ? 'Niet beschikbaar' : 'Beschikbaar'}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Legend />
        </Card>
      </div>

      {/* ================= MOBILE LAYOUT ================= */}
      <div className="lg:hidden space-y-4">
        {/* Calendar card */}
        <Card className="p-4 border-2 border-gray-100 rounded-3xl bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900 capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: nl })}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={goToPrevMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNextMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-purple-600 border-2 border-purple-100 hover:bg-purple-50"
            >
              Vandaag
            </button>
            <SyncButton compact />
          </div>

          {hasExternalIntegration && lastSyncedLabel && (
            <p className="text-[11px] text-gray-400 mb-2 px-1">
              Gesynchroniseerd {lastSyncedLabel}
            </p>
          )}

          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {MOBILE_WEEKDAY_LABELS.map((label, i) => (
                <div
                  key={i}
                  className="py-1.5 text-center text-[10px] font-bold text-gray-600"
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthGrid.map((cell, idx) => {
                const status = getDayStatus(cell.date);
                const events = getEventsForDay(cell.date);
                const inMonth = cell.isCurrentMonth;
                const colEnd = (idx + 1) % 7 === 0;
                const rowEnd = idx >= monthGrid.length - 7;

                return (
                  <button
                    key={cell.date.toISOString()}
                    type="button"
                    onClick={() => setSelectedDate(cell.date)}
                    className={`aspect-square relative p-1 text-[11px] bg-white active:bg-gray-100
                      ${colEnd ? '' : 'border-r border-gray-200'}
                      ${rowEnd ? '' : 'border-b border-gray-200'}
                      ${inMonth ? statusBorderClass(status) : 'border-l-[2px] border-l-transparent opacity-40'}
                    `}
                  >
                    <span
                      className={`absolute top-1 right-1.5 font-medium ${
                        inMonth ? 'text-gray-700' : 'text-gray-300'
                      }`}
                    >
                      {format(cell.date, 'd')}
                    </span>
                    {inMonth && events.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {events.slice(0, 3).map((event, i) => (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${mobileDotClass(event.kind)}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Legend />
        </Card>

        <OccupancyCard />
        <NextBookingCard />
        <InsightsCard />
      </div>

      {/* ================= DAY DETAIL DIALOG (shared) ================= */}
      <Dialog
        open={selectedDate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDate(null);
            setBlockReason('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          {selectedDate && selectedDayInfo && (
            <>
              <DialogTitle className="text-xl font-bold text-gray-900 capitalize pr-8">
                {format(selectedDate, 'EEEE d MMMM yyyy', { locale: nl })}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="flex items-center gap-2 mt-1">
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
                  <span className="text-sm text-gray-600">
                    {selectedDayInfo.status === 'available' && 'Beschikbaar'}
                    {selectedDayInfo.status === 'booked' && 'Geboekt'}
                    {selectedDayInfo.status === 'blocked' && 'Niet beschikbaar'}
                    {selectedDayInfo.status === 'external_google' && 'Bezet via Google Calendar'}
                    {selectedDayInfo.status === 'external_ical' && 'Bezet via iCalendar'}
                    {selectedDayInfo.status === 'past' && 'Verlopen'}
                  </span>
                </div>
              </DialogDescription>

              {/* Event card inside dialog */}
              {selectedDayInfo.status === 'booked' && selectedDayInfo.booked && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl">
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-500">Klant:</span>{' '}
                    <span className="font-semibold">{selectedDayInfo.booked.customerName}</span>
                  </p>
                  {selectedDayInfo.booked.eventType && (
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="text-gray-500">Type:</span>{' '}
                      <span className="font-semibold">{selectedDayInfo.booked.eventType}</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Geboekte datums kunnen niet handmatig gewijzigd worden.
                  </p>
                </div>
              )}

              {(selectedDayInfo.status === 'external_google' ||
                selectedDayInfo.status === 'external_ical') &&
                selectedDayInfo.external && (
                  <div
                    className={`${
                      selectedDayInfo.status === 'external_google'
                        ? 'bg-blue-50 border-blue-400'
                        : 'bg-purple-50 border-purple-400'
                    } border-l-4 p-4 rounded-xl`}
                  >
                    {selectedDayInfo.external.title && (
                      <p className="text-sm text-gray-700">
                        <span className="text-gray-500">Agendaitem:</span>{' '}
                        <span className="font-semibold">{selectedDayInfo.external.title}</span>
                      </p>
                    )}
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="text-gray-500">Bron:</span>{' '}
                      <span
                        className={`font-semibold ${
                          selectedDayInfo.status === 'external_google'
                            ? 'text-blue-700'
                            : 'text-purple-700'
                        }`}
                      >
                        {selectedDayInfo.status === 'external_google'
                          ? 'Google Calendar'
                          : 'iCalendar'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Bewerk dit event in je externe agenda om de beschikbaarheid te wijzigen.
                    </p>
                  </div>
                )}

              {selectedDayInfo.status === 'blocked' && selectedDayInfo.blocked?.reason && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-xl">
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-500">Reden:</span>{' '}
                    <span className="font-semibold">{selectedDayInfo.blocked.reason}</span>
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                {selectedDayInfo.status === 'available' && (
                  <>
                    <Input
                      placeholder="Reden (optioneel)"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      className="border-2 border-gray-200 rounded-xl h-11 text-sm"
                    />
                    <Button
                      onClick={() => handleBlockDate(selectedDate, blockReason)}
                      disabled={saving}
                      className="w-full rounded-xl border-2 border-red-300 text-red-700 bg-white hover:bg-red-50 font-semibold h-11"
                      variant="outline"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4 mr-2" />
                      )}
                      Niet beschikbaar zetten
                    </Button>
                  </>
                )}

                {selectedDayInfo.status === 'blocked' && (
                  <Button
                    onClick={() => handleUnblockDate(selectedDate)}
                    disabled={saving}
                    className="w-full rounded-xl border-2 border-green-300 text-green-700 bg-white hover:bg-green-50 font-semibold h-11"
                    variant="outline"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Unlock className="w-4 h-4 mr-2" />
                    )}
                    Beschikbaar maken
                  </Button>
                )}

                {selectedDayInfo.status === 'past' && (
                  <p className="text-sm text-gray-400 text-center py-2">
                    Verlopen datums kunnen niet gewijzigd worden.
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
