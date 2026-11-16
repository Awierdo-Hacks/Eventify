import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Check,
  ChevronDown,
  FileText,
  MessageSquare,
  Search,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/ui/category-icon';
import { Select } from '@/components/ui/input';
import { site } from '@/config/site';
import { jsonLd } from '@/lib/json-ld';
import { ProviderCard } from '@/features/providers/components/provider-card';
import { getCategoryCounts, getFeaturedProviders } from '@/features/providers/queries';
import { CATEGORIES, FEATURED_CATEGORY_SLUGS, categoryStoredValues } from '@/lib/catalog';
import { pluralize } from '@/lib/format';

const STEPS = [
  {
    icon: Search,
    title: 'Vertel wat je plant',
    text: 'Kies je type event en wat je nodig hebt. Zoek op categorie en regio, en bekijk profielen, foto’s en beoordelingen.',
  },
  {
    icon: FileText,
    title: 'Vergelijk offertes',
    text: 'Vraag vrijblijvend offertes aan en ontvang ze overzichtelijk naast elkaar. Stel vragen via de chat.',
  },
  {
    icon: CalendarCheck,
    title: 'Leg vast en vier',
    text: 'Accepteer de offerte die bij je past. Je ziet in één oogopslag wat geregeld is en wat nog openstaat.',
  },
];

const FAQ = [
  {
    question: 'Wat kost Eventiphy voor mij als klant?',
    answer:
      'Een account aanmaken, zoeken en offertes aanvragen is gratis. Je betaalt alleen de prijs die je met de dienstverlener afspreekt.',
  },
  {
    question: 'Hoe weet ik dat een dienstverlener betrouwbaar is?',
    answer:
      'Elke dienstverlener wordt door ons team nagekeken voordat het profiel zichtbaar wordt. Beoordelingen kunnen alleen geplaatst worden door klanten met een afgeronde boeking bij die dienstverlener.',
  },
  {
    question: 'Zit ik ergens aan vast als ik een offerte aanvraag?',
    answer:
      'Nee. Een offerte aanvragen is altijd vrijblijvend. Er is pas een afspraak wanneer jij een offerte uitdrukkelijk accepteert.',
  },
  {
    question: 'Kan ik meerdere dienstverleners voor één event regelen?',
    answer:
      'Ja. Maak een event aan, kies wat je nodig hebt — bijvoorbeeld locatie, catering en muziek — en koppel per onderdeel de offertes die je ontvangt. Zo houd je overzicht over het geheel en je budget.',
  },
  {
    question: 'Ik bied zelf diensten aan. Hoe kom ik op Eventiphy?',
    answer:
      'Maak een account aan als dienstverlener en vul je profiel in. Na een korte controle door ons team is je profiel zichtbaar en kun je aanvragen ontvangen.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.name,
  url: site.url,
  logo: `${site.url}/icon.svg`,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: site.contact.phone,
    email: site.contact.email,
    contactType: 'customer service',
    availableLanguage: 'Dutch',
  },
  sameAs: [site.social.instagram],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: site.name,
  url: site.url,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${site.url}/browse?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default async function HomePage() {
  // Featured providers and counts are a bonus: if the database is briefly
  // unavailable the page still renders, without them.
  const [featured, counts] = await Promise.all([
    getFeaturedProviders(6).catch((error) => {
      console.error('[home] featured providers unavailable', error);
      return [];
    }),
    getCategoryCounts().catch((error): Record<string, number> => {
      console.error('[home] category counts unavailable', error);
      return {};
    }),
  ]);
  const categories = FEATURED_CATEGORY_SLUGS.map((slug) =>
    CATEGORIES.find((category) => category.slug === slug)!
  );
  const countFor = (slug: string) =>
    categoryStoredValues(slug).reduce((sum, value) => sum + (counts[value] ?? 0), 0);

  return (
    <>
      {[organizationJsonLd, websiteJsonLd, faqJsonLd].map((data, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={jsonLd(data)} />
      ))}

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-wash">
        <div className="container-page grid items-center gap-12 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-20">
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-surface/70 px-3 py-1 text-xs font-semibold text-brand-800 backdrop-blur">
              <Sparkles className="size-3.5" aria-hidden />
              Het platform voor evenementen in België
            </p>
            <h1 className="mt-5 text-[2.625rem] font-extrabold leading-[1.05] text-ink-950 sm:text-6xl lg:text-[4.25rem]">
              Jouw{' '}
              <span className="text-brand-gradient pr-1 font-serif font-normal italic tracking-normal">
                droomfeest
              </span>{' '}
              begint hier
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-600 sm:text-xl">
              Vind geverifieerde fotografen, dj’s, cateraars en locaties. Vergelijk offertes en
              regel je hele event op één plek.
            </p>

            <form
              action="/browse"
              role="search"
              aria-label="Dienstverleners zoeken"
              className="mt-8 flex flex-col gap-2 rounded-2xl border border-ink-200 bg-surface p-2 shadow-md sm:flex-row sm:items-center"
            >
              <label className="sr-only" htmlFor="hero-category">
                Categorie
              </label>
              <Select
                id="hero-category"
                name="category"
                defaultValue=""
                className="h-12 border-transparent shadow-none hover:border-transparent sm:w-52 sm:border-r-ink-200 sm:rounded-r-none"
              >
                <option value="">Alle categorieën</option>
                {CATEGORIES.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.label}
                  </option>
                ))}
              </Select>
              <label className="sr-only" htmlFor="hero-q">
                Naam of plaats
              </label>
              <input
                id="hero-q"
                name="q"
                type="search"
                placeholder="Zoek op naam of plaats, bv. Antwerpen"
                className="h-12 min-w-0 flex-1 rounded-lg bg-transparent px-3.5 text-[0.9375rem] text-ink-950 placeholder:text-ink-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
              />
              <Button type="submit" size="lg" variant="gradient" className="shrink-0">
                <Search aria-hidden />
                Zoeken
              </Button>
            </form>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink-700">
              {[
                'Gecontroleerde dienstverleners',
                'Gratis en vrijblijvend offertes',
                'Alles op één plek',
              ].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="size-4 text-success-600" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <HeroPreview />
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────────── */}
      <section className="container-page py-16 sm:py-20" aria-labelledby="categories-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="categories-title" className="text-3xl font-extrabold text-ink-950 sm:text-4xl">
              Alles voor je event
            </h2>
            <p className="mt-2 text-lg text-ink-600">Begin bij wat je nodig hebt.</p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/browse">
              Alle dienstverleners <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {categories.map((category) => {
            const count = countFor(category.slug);
            return (
              <li key={category.slug}>
                <Link
                  href={`/browse?category=${category.slug}`}
                  className="group flex h-full flex-col gap-4 rounded-2xl border border-ink-200 bg-surface p-4 shadow-xs transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md sm:p-5"
                >
                  <CategoryIcon
                    category={category.slug}
                    size="lg"
                    className="transition-colors group-hover:bg-brand-600 group-hover:text-white"
                  />
                  <span>
                    <span className="block font-bold text-ink-950">{category.label}</span>
                    <span className="mt-0.5 block text-sm text-ink-600">
                      {count > 0
                        ? pluralize(count, 'dienstverlener', 'dienstverleners')
                        : category.description}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section
        id="hoe-het-werkt"
        className="scroll-mt-20 border-y border-ink-200/70 bg-surface"
        aria-labelledby="how-title"
      >
        <div className="container-page py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-brand-700">
              Hoe het werkt
            </p>
            <h2 id="how-title" className="mt-2 text-3xl font-extrabold text-ink-950 sm:text-4xl">
              Van idee tot feest in drie stappen
            </h2>
          </div>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="relative rounded-2xl bg-canvas p-6 ring-1 ring-ink-200"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-ink-950 text-white">
                    <step.icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-serif text-4xl italic text-brand-300" aria-hidden>
                    {index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-ink-950">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Featured providers ───────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="container-page py-16 sm:py-20" aria-labelledby="featured-title">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="featured-title" className="text-3xl font-extrabold text-ink-950 sm:text-4xl">
                Goed beoordeeld door klanten
              </h2>
              <p className="mt-2 text-lg text-ink-600">
                Een greep uit de dienstverleners op Eventiphy.
              </p>
            </div>
            <Button asChild variant="ghost">
              <Link href="/browse">
                Bekijk ze allemaal <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((provider) => (
              <li key={provider.id}>
                <ProviderCard provider={provider} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Event planner ────────────────────────────────────────────────── */}
      <section className="container-page pb-16 sm:pb-20" aria-labelledby="planner-title">
        <div className="grid items-center gap-10 rounded-3xl border border-ink-200 bg-surface p-6 shadow-xs sm:p-10 lg:grid-cols-2 lg:gap-16 lg:p-14">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-brand-700">
              Eventplanner
            </p>
            <h2
              id="planner-title"
              className="mt-2 text-3xl font-extrabold text-ink-950 sm:text-4xl"
            >
              Eén overzicht voor je hele event
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-600">
              Een bruiloft is meer dan één boeking. Maak je event aan, kies wat je nodig hebt en
              volg per onderdeel waar je staat.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                {
                  icon: Check,
                  text: 'Kant-en-klare sjablonen voor bruiloft, verjaardag, bedrijfsfeest en festival',
                },
                { icon: Wallet, text: 'Zie wat al vastligt en hoeveel budget er nog over is' },
                { icon: MessageSquare, text: 'Overleg met dienstverleners in één inbox' },
              ].map((item) => (
                <li key={item.text} className="flex gap-3 text-ink-800">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <item.icon className="size-3.5" aria-hidden />
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-8">
              <Link href="/register">
                Plan je event <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
          <PlannerPreview />
        </div>
      </section>

      {/* ── For providers ────────────────────────────────────────────────── */}
      <section className="container-page" aria-labelledby="providers-title">
        <div className="relative overflow-hidden rounded-3xl bg-ink-950 px-6 py-12 text-white sm:px-12 sm:py-16">
          <div
            className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-brand-600/40 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-32 right-40 size-80 rounded-full bg-sun-500/25 blur-3xl"
            aria-hidden
          />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-sun-300">
                Voor dienstverleners
              </p>
              <h2 id="providers-title" className="mt-2 text-3xl font-extrabold sm:text-4xl">
                Meer aanvragen, minder heen-en-weer
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-300">
                Ontvang gerichte aanvragen van klanten in jouw regio, stuur offertes in een paar
                klikken en houd je agenda automatisch bij.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="gradient">
                  <Link href="/register?type=provider">Word dienstverlener</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10"
                >
                  <Link href="/voor-dienstverleners">Meer weten</Link>
                </Button>
              </div>
            </div>
            <ul className="grid gap-3">
              {[
                'Gratis profiel met foto’s, diensten en prijzen',
                'Agenda gekoppeld aan Google Calendar of iCal',
                'Offertes, boekingen en berichten op één plek',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-medium backdrop-blur"
                >
                  <BadgeCheck className="size-5 shrink-0 text-sun-300" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="container-page py-16 sm:py-20" aria-labelledby="faq-title">
        <div className="mx-auto max-w-3xl">
          <h2
            id="faq-title"
            className="text-center text-3xl font-extrabold text-ink-950 sm:text-4xl"
          >
            Veelgestelde vragen
          </h2>
          <div className="mt-8 divide-y divide-ink-200 rounded-2xl border border-ink-200 bg-surface">
            {FAQ.map((item) => (
              <details key={item.question} className="group px-5 sm:px-6">
                <summary className="flex list-none items-center justify-between gap-4 py-5 text-left font-bold text-ink-950 [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronDown
                    className="size-5 shrink-0 text-ink-400 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="pb-5 leading-relaxed text-ink-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────────────────── */}
      <section className="container-page" aria-labelledby="cta-title">
        <div className="rounded-3xl bg-gradient-to-br from-brand-50 via-surface to-sun-50 px-6 py-14 text-center ring-1 ring-ink-200 sm:py-20">
          <h2
            id="cta-title"
            className="mx-auto max-w-2xl text-3xl font-extrabold text-ink-950 sm:text-5xl"
          >
            Klaar om je event{' '}
            <span className="text-brand-gradient pr-1 font-serif font-normal italic tracking-normal">
              onvergetelijk
            </span>{' '}
            te maken?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-600">
            Maak gratis een account aan en vraag vandaag nog je eerste offertes aan.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/register">Gratis beginnen</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/browse">Eerst rondkijken</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

/** Product preview built from markup, so it stays sharp and loads instantly. */
function HeroPreview() {
  const slots = [
    {
      category: 'venues',
      label: 'Locatie',
      name: 'Loft Zuiderdok',
      price: '€ 2.400',
      state: 'Vastgelegd',
      done: true,
    },
    {
      category: 'catering',
      label: 'Catering',
      name: 'Atelier Smaak',
      price: '€ 3.150',
      state: 'Vastgelegd',
      done: true,
    },
    {
      category: 'dj',
      label: 'DJ & muziek',
      name: '3 offertes ontvangen',
      price: 'vanaf € 650',
      state: 'Kiezen',
      done: false,
    },
  ];
  return (
    <div
      className="relative mx-auto mb-10 w-full max-w-md animate-rise [animation-delay:120ms] sm:mb-14 lg:max-w-none"
      aria-hidden
    >
      <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-200/50 to-sun-200/50 blur-2xl" />
      <div className="rounded-3xl border border-ink-200 bg-surface p-5 shadow-lg sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              Bruiloft · 14 juni
            </p>
            <p className="mt-1 text-xl font-extrabold text-ink-950">Emma &amp; Lars</p>
          </div>
          <span className="rounded-full bg-success-100 px-2.5 py-1 text-xs font-semibold text-success-800">
            Op schema
          </span>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-semibold text-ink-600">
            <span>2 van 3 geregeld</span>
            <span>67%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
            <div className="bg-brand-gradient h-full w-2/3 rounded-full" />
          </div>
        </div>
        <ul className="mt-5 space-y-2.5">
          {slots.map((slot) => (
            <li
              key={slot.label}
              className="flex items-center gap-3 rounded-xl border border-ink-200 p-3"
            >
              <CategoryIcon category={slot.category} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-ink-500">{slot.label}</p>
                <p className="truncate text-sm font-bold text-ink-950">{slot.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-ink-950">{slot.price}</p>
                <p
                  className={`text-xs font-semibold ${slot.done ? 'text-success-700' : 'text-brand-700'}`}
                >
                  {slot.state}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="absolute -bottom-14 -left-3 hidden w-60 rounded-2xl border border-ink-200 bg-surface p-4 shadow-lg sm:block lg:-left-12">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-500">
          <MessageSquare className="size-3.5 text-brand-600" /> Nieuw bericht
        </div>
        <p className="mt-1.5 text-sm font-medium leading-snug text-ink-900">
          “Hoi Emma, ik heb de offerte aangepast voor 120 gasten.”
        </p>
      </div>
    </div>
  );
}

function PlannerPreview() {
  const rows = [
    {
      category: 'venues',
      label: 'Locatie',
      tone: 'bg-success-100 text-success-800',
      state: 'Vastgelegd',
    },
    {
      category: 'catering',
      label: 'Catering',
      tone: 'bg-brand-100 text-brand-800',
      state: '2 offertes',
    },
    {
      category: 'photography',
      label: 'Fotografie',
      tone: 'bg-sun-100 text-sun-800',
      state: 'Aangevraagd',
    },
    {
      category: 'flowers',
      label: 'Bloemen',
      tone: 'bg-ink-100 text-ink-700',
      state: 'Nog te regelen',
    },
  ];
  return (
    <div
      className="rounded-2xl bg-gradient-to-br from-brand-50 to-sun-50 p-4 ring-1 ring-ink-200 sm:p-6"
      aria-hidden
    >
      <div className="rounded-xl bg-surface p-4 shadow-sm ring-1 ring-ink-200">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-ink-950">Wat heb je nodig?</p>
          <p className="text-xs font-semibold text-ink-500">Budget € 12.000</p>
        </div>
        <ul className="mt-3 divide-y divide-ink-100">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center gap-3 py-2.5">
              <CategoryIcon category={row.category} size="sm" />
              <span className="flex-1 text-sm font-semibold text-ink-900">{row.label}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.tone}`}>
                {row.state}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2.5 text-sm">
          <span className="font-medium text-ink-600">Al vastgelegd</span>
          <span className="font-bold text-ink-950">€ 2.400</span>
        </div>
      </div>
    </div>
  );
}
