import type { Metadata } from 'next';
import Link from 'next/link';
import { Eye, HeartHandshake, Mail, MapPin, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { site } from '@/config/site';

export const metadata: Metadata = {
  title: 'Over ons',
  description:
    'Eventiphy brengt mensen die iets te vieren hebben samen met de dienstverleners die het mogelijk maken. Lees waar we voor staan en neem contact op.',
  alternates: { canonical: '/about' },
};

const VALUES = [
  { icon: Eye, title: 'Transparant', text: 'Duidelijke profielen, eerlijke beoordelingen en offertes die je naast elkaar kunt leggen.' },
  { icon: ShieldCheck, title: 'Betrouwbaar', text: 'We kijken elke dienstverlener na voordat een profiel zichtbaar wordt.' },
  { icon: HeartHandshake, title: 'Persoonlijk', text: 'Je overlegt rechtstreeks met de mensen die je event gaan maken.' },
  { icon: Sparkles, title: 'Eenvoudig', text: 'Van eerste idee tot laatste afspraak op één plek, zonder losse mailtjes.' },
];

const CONTACT = [
  { icon: Mail, label: 'E-mail', value: site.contact.email, href: `mailto:${site.contact.email}` },
  { icon: Phone, label: 'Telefoon', value: site.contact.phone, href: site.contact.phoneHref },
  { icon: MapPin, label: 'Standplaats', value: 'Antwerpen, België', href: undefined },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-hero-wash">
        <div className="container-page py-14 sm:py-20">
          <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Over ons</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-extrabold text-ink-950 sm:text-6xl">
            Elk feest verdient de{' '}
            <span className="text-brand-gradient pr-1 font-serif font-normal italic tracking-normal">juiste mensen</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-600 sm:text-xl">
            Een event organiseren betekent vaak eindeloos zoeken, mailen en vergelijken. Eventiphy maakt dat
            eenvoudiger: één plek waar je dienstverleners vindt, offertes vergelijkt en alles vastlegt.
          </p>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20" aria-labelledby="mission-title">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 id="mission-title" className="text-3xl font-extrabold text-ink-950">
              Waarom we dit doen
            </h2>
            <div className="mt-4 space-y-4 text-lg leading-relaxed text-ink-600">
              <p>
                We merkten zelf hoe versnipperd het organiseren van een feest is. De fotograaf vind je via via, de
                cateraar via een zoekmachine, en afspraken staan verspreid over mails en berichtjes.
              </p>
              <p>
                Tegelijk hebben goede dienstverleners het moeilijk om gevonden te worden door de klanten die bij hen
                passen. Eventiphy brengt beide kanten samen, vanuit Antwerpen en voor heel België.
              </p>
            </div>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {VALUES.map((value) => (
              <li key={value.title} className="rounded-2xl border border-ink-200 bg-surface p-5 shadow-xs">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <value.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-bold text-ink-950">{value.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-600">{value.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="contact" className="container-page scroll-mt-24" aria-labelledby="contact-title">
        <div className="rounded-3xl border border-ink-200 bg-surface p-6 shadow-xs sm:p-10">
          <h2 id="contact-title" className="text-3xl font-extrabold text-ink-950">
            Neem contact op
          </h2>
          <p className="mt-2 max-w-xl text-lg text-ink-600">
            Een vraag, een idee of iets dat beter kan? We horen het graag.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {CONTACT.map((item) => (
              <li key={item.label} className="flex items-center gap-4 rounded-2xl bg-canvas p-4 ring-1 ring-ink-200">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink-950 text-white">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink-500">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} className="block truncate font-bold text-ink-950 hover:text-brand-700">
                      {item.value}
                    </a>
                  ) : (
                    <p className="font-bold text-ink-950">{item.value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/browse">Ontdek dienstverleners</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/voor-dienstverleners">Ik ben dienstverlener</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
