'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import {
  ConfirmationDialog,
  DialogActions,
  DialogButton,
  DialogTextField,
} from '@/components/ui/confirmation-dialog';

interface ReviewDialogProps {
  booking: { id: string; providerName: string } | null;
  onClose: () => void;
  onSubmitted: () => void;
}

/** Review form for a completed booking (one review per booking). */
export function ReviewDialog({ booking, onClose, onSubmitted }: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setRating(0);
    setHover(0);
    setTitle('');
    setComment('');
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!booking) return;
    if (rating < 1) return setError('Kies een aantal sterren');
    if (title.trim().length < 2) return setError('Geef je review een korte titel');
    if (comment.trim().length < 10) return setError('Schrijf minstens een korte zin (10 tekens)');

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, rating, title: title.trim(), comment: comment.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Er ging iets mis bij het plaatsen van je review');
      reset();
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ConfirmationDialog
      open={!!booking}
      onOpenChange={(open) => !open && close()}
      title="Schrijf een review"
      description={booking ? `Hoe was je ervaring met ${booking.providerName}? Je review helpt andere klanten.` : ''}
    >
      <div className="flex items-center justify-center gap-1 mb-4" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} ster${value > 1 ? 'ren' : ''}`}
            onClick={() => setRating(value)}
            onMouseEnter={() => setHover(value)}
            className="p-1"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                value <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titel</label>
        <input
          type="text"
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bijv. 'Fantastisch eten en super service'"
          className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 text-gray-900 focus:outline-none focus:border-purple-400"
        />
      </div>

      <DialogTextField
        label="Je ervaring"
        value={comment}
        onChange={setComment}
        placeholder="Wat ging er goed? Wat kan beter?"
        rows={4}
        required
      />

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">{error}</p>}

      <DialogActions>
        <DialogButton onClick={submit} variant="primary" loading={submitting} disabled={submitting}>
          Review plaatsen
        </DialogButton>
        <DialogButton onClick={close} variant="outline" disabled={submitting}>
          Annuleren
        </DialogButton>
      </DialogActions>
    </ConfirmationDialog>
  );
}
