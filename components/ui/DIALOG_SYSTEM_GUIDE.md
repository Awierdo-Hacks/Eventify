# 🎨 Herbruikbaar Dialog Systeem - Gebruikshandleiding

## 📋 Overzicht

Dit is een volledig modulair en herbruikbaar dialog systeem voor Eventify. Alle confirmatie dialogs gebruiken dezelfde **bouwstenen** (building blocks) voor consistente UI en makkelijk onderhoud.

---

## 🏗️ Architectuur

### 1. **Fundering (Foundation)**
```tsx
<ConfirmationDialog 
  open={open}
  onOpenChange={handleClose}
  title="Dialog Titel"
  description="Beschrijving van de actie"
>
  {/* Bouwstenen komen hier */}
</ConfirmationDialog>
```

### 2. **Bouwstenen (Building Blocks)**

#### DialogQuoteInfo
Toont quote informatie met prijs, package naam, services, en event details.
```tsx
<DialogQuoteInfo
  quote={{
    totalPrice: 2500,
    packageName: "Premium Pakket",
    includedServices: ["Service 1", "Service 2"],
    serviceRequest: {
      customer: { name: "Jan Jansen" },
      eventType: "Bruiloft",
      eventDate: "2025-12-31"
    }
  }}
  status="pending" | "rejected" | "accepted"
/>
```

#### DialogRejectionReason
Toont waarom een quote is afgewezen.
```tsx
<DialogRejectionReason
  reason="Prijs te hoog voor ons budget"
  rejectedAt="2025-11-09"
/>
```

#### DialogWarning
Waarschuwing met verschillende types.
```tsx
<DialogWarning
  type="warning" | "error" | "info"
  title="Let op!"
  message="Deze actie kan niet ongedaan worden gemaakt."
  icon="⚠️" // optioneel
/>
```

#### DialogTextField
Tekst invoerveld voor redenen, feedback, etc.
```tsx
<DialogTextField
  label="Reden van afwijzing"
  value={reason}
  onChange={setReason}
  placeholder="Typ hier..."
  required={false}
  rows={3}
  helperText="Dit is optioneel"
/>
```

#### DialogActions + DialogButton
Actie knoppen met verschillende styles.
```tsx
<DialogActions>
  <DialogButton
    onClick={handleConfirm}
    variant="danger" | "success" | "primary" | "outline"
    disabled={false}
    loading={isLoading}
  >
    Bevestigen
  </DialogButton>
  <DialogButton
    onClick={handleCancel}
    variant="outline"
  >
    Annuleren
  </DialogButton>
</DialogActions>
```

---

## 📚 Praktische Voorbeelden

### ✅ Voorbeeld 1: Quote Afwijzen (Customer)
```tsx
<ConfirmationDialog
  open={!!rejectingQuote}
  onOpenChange={(open) => !open && setRejectingQuote(null)}
  title="Offerte afwijzen?"
  description="Weet je zeker dat je deze offerte wilt afwijzen?"
>
  <DialogQuoteInfo quote={rejectingQuote} status="pending" />
  
  <DialogTextField
    label="Waarom wijs je deze offerte af?"
    value={reason}
    onChange={setReason}
    placeholder="Bijv. 'Prijs te hoog'..."
    helperText="Je feedback helpt providers"
  />
  
  <DialogActions>
    <DialogButton onClick={handleReject} variant="danger">
      Toch afwijzen
    </DialogButton>
    <DialogButton onClick={handleClose} variant="outline">
      Behouden
    </DialogButton>
  </DialogActions>
</ConfirmationDialog>
```

### ✅ Voorbeeld 2: Aanvraag Annuleren (Provider)
```tsx
<ConfirmationDialog
  open={!!cancelingQuote}
  onOpenChange={(open) => !open && setCancelingQuote(null)}
  title="Aanvraag Annuleren?"
  description="Deze actie kan niet ongedaan worden gemaakt."
>
  <DialogQuoteInfo quote={cancelingQuote} status="rejected" />
  
  <DialogRejectionReason
    reason={cancelingQuote.rejectionReason}
    rejectedAt={cancelingQuote.rejectedAt}
  />
  
  <DialogWarning
    type="warning"
    title="Let op!"
    message="De offerte wordt permanent verwijderd."
  />
  
  <DialogActions>
    <DialogButton onClick={handleCancel} variant="danger" loading={loading}>
      Ja, Annuleren
    </DialogButton>
    <DialogButton onClick={handleClose} variant="outline">
      Behouden
    </DialogButton>
  </DialogActions>
</ConfirmationDialog>
```

### ✅ Voorbeeld 3: Booking Bevestigen
```tsx
<ConfirmationDialog
  open={!!confirmingBooking}
  onOpenChange={(open) => !open && setConfirmingBooking(null)}
  title="Boeking bevestigen?"
  description="Bevestig dat je deze boeking wilt plaatsen."
>
  <DialogQuoteInfo quote={booking.quote} status="accepted" />
  
  <DialogWarning
    type="info"
    title="Betaling vereist"
    message="Na bevestiging ontvang je een betalingslink."
    icon="💳"
  />
  
  <DialogActions>
    <DialogButton onClick={handleConfirm} variant="success">
      Ja, Bevestigen
    </DialogButton>
    <DialogButton onClick={handleClose} variant="outline">
      Annuleren
    </DialogButton>
  </DialogActions>
</ConfirmationDialog>
```

### ✅ Voorbeeld 4: Account Verwijderen
```tsx
<ConfirmationDialog
  open={!!deletingAccount}
  onOpenChange={(open) => !open && setDeletingAccount(null)}
  title="Account verwijderen?"
  description="Dit is een permanente actie!"
  maxWidth="md"
>
  <DialogWarning
    type="error"
    title="Waarschuwing!"
    message="Al je gegevens, bookings en historiek worden permanent verwijderd. Deze actie kan NIET ongedaan worden gemaakt."
    icon="🚫"
  />
  
  <DialogTextField
    label="Typ 'VERWIJDEREN' ter bevestiging"
    value={confirmation}
    onChange={setConfirmation}
    placeholder="VERWIJDEREN"
    required
  />
  
  <DialogActions>
    <DialogButton 
      onClick={handleDelete} 
      variant="danger"
      disabled={confirmation !== 'VERWIJDEREN'}
    >
      Account Verwijderen
    </DialogButton>
    <DialogButton onClick={handleClose} variant="outline">
      Annuleren
    </DialogButton>
  </DialogActions>
</ConfirmationDialog>
```

---

## 🎨 UI Design Rules

Alle componenten volgen automatisch de Eventify design guidelines:

✅ **Rounded Corners**: `rounded-3xl` voor dialogs, `rounded-xl` voor sections  
✅ **Shadows**: `shadow-eventify-lg` voor dialogs, `shadow-sm` voor sections  
✅ **Gradients**: Automatisch toegepast op quote info (status-afhankelijk)  
✅ **Colors**: Consistent gebruik van brand colors (purple, pink, red, etc.)  
✅ **Typography**: Font weights en sizes volgens design system  
✅ **Spacing**: Consistent gebruik van padding en gaps  
✅ **Animations**: Smooth transitions en hover effects  

---

## 🚀 Voordelen

1. **🔄 Herbruikbaarheid**: Schrijf 1x, gebruik overal
2. **🎨 Consistentie**: Alle dialogs zien er hetzelfde uit
3. **⚡ Snelheid**: Nieuwe dialog in 10 regels code
4. **🛠️ Onderhoud**: 1 plek aanpassen = overal geüpdatet
5. **📱 Responsive**: Werkt automatisch op alle schermen
6. **♿ Toegankelijkheid**: ARIA labels en keyboard support
7. **🎭 Type-safe**: Volledige TypeScript ondersteuning

---

## 📝 Checklist voor Nieuwe Dialogs

Wanneer je een nieuwe confirmatie dialog nodig hebt:

- [ ] Gebruik `ConfirmationDialog` als basis
- [ ] Kies relevante bouwstenen voor je use case
- [ ] Gebruik `DialogQuoteInfo` voor quote informatie
- [ ] Voeg `DialogWarning` toe voor belangrijke acties
- [ ] Gebruik `DialogTextField` voor user input
- [ ] Gebruik `DialogActions` + `DialogButton` voor knoppen
- [ ] Test loading states met `loading={true}`
- [ ] Test disabled states met `disabled={true}`
- [ ] Controleer responsive design op mobiel
- [ ] Test keyboard navigation (Tab, Escape, Enter)

---

## 🔍 Implementatie Details

### Locaties:
- **Component**: `components/ui/confirmation-dialog.tsx`
- **Customer Dashboard**: `app/dashboard/page.tsx`
- **Provider Dashboard**: `app/provider-dashboard/page.tsx`

### Dependencies:
- `@/components/ui/dialog` - Base dialog component
- `@/components/ui/button` - Button component
- `@/components/ui/badge` - Badge component
- `@/lib/utils` - cn() helper voor className merging
- `lucide-react` - Icons (CheckCircle, X, etc.)

---

## 🎓 Tips & Best Practices

1. **State Management**: Gebruik `null` state voor closed dialogs (`open={!!state}`)
2. **Loading States**: Altijd `loading` prop gebruiken voor async actions
3. **Error Handling**: Toon errors buiten dialog (niet daarin)
4. **Success Messages**: Sluit dialog en toon success message in parent
5. **Validation**: Valideer input voordat dialog sluiten
6. **UX**: Altijd een "Annuleren" optie geven
7. **Copy**: Gebruik duidelijke, actie-gerichte button teksten
8. **Destructive Actions**: Altijd `variant="danger"` + extra waarschuwing

---

## 📞 Support

Bij vragen over het dialog systeem:
- Check deze guide eerst
- Bekijk bestaande implementaties in `dashboard/page.tsx` en `provider-dashboard/page.tsx`
- Test nieuwe patterns in Storybook (indien beschikbaar)

**Happy Building! 🚀**
