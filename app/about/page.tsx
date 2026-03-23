import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, PageHeader, Section } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MapPin, Instagram, Target, Users, Sparkles, Shield, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Over Ons - Eventiphy',
  description:
    'Ontdek de missie van Eventiphy en neem contact op met ons team voor jouw volgende evenement.',
};

const teamMembers = [
  {
    name: 'Zaid Equarqoune',
    role: 'CEO',
    description: 'Stuurt de strategische visie en de groei van Eventiphy als centraal platform voor events.',
  },
  {
    name: 'Lander Verhoeven',
    role: 'COO',
    description: 'Bewaakt operationele kwaliteit en zorgt voor vlotte samenwerking tussen klanten, providers en team.',
  },
  {
    name: 'Lucas Hendrickx',
    role: 'CTO',
    description: 'Verantwoordelijk voor platformontwikkeling, technische stabiliteit en schaalbare architectuur.',
  },
  {
    name: 'Khaïreddine El Moukhtari',
    role: 'CMO',
    description: 'Leidt merkpositionering, marketing en online zichtbaarheid om duurzame groei te realiseren.',
  },
  {
    name: 'Lander Present',
    role: 'CFO',
    description: 'Waakt over financiële strategie, budgetten en duurzame bedrijfsvoering van Eventiphy.',
  },
];

const contactItems = [
  {
    icon: Mail,
    title: 'E-mail',
    value: 'eventiphy@gmail.com',
    href: 'mailto:eventiphy@gmail.com',
  },
  {
    icon: Phone,
    title: 'Telefoon',
    value: '+32 486 71 47 88',
    href: 'tel:+32486714788',
  },
  {
    icon: MapPin,
    title: 'Regio',
    value: 'Antwerpen, België',
    href: '#',
  },
];

const socialItems = [
  {
    icon: Instagram,
    label: 'Instagram',
    href: 'https://www.instagram.com/eventiphy.be?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <Section background="gradient-hero" className="py-10 md:py-14">
        <Container className="py-0">
          <PageHeader
            title="Over Ons"
            subtitle="Plan slimmer. Vier groter. Eventiphy verbindt klanten en dienstverleners in één veilige, snelle en duidelijke eventomgeving."
            gradient
            className="mb-0"
          />
        </Container>
      </Section>

      <Section className="py-8 md:py-12">
        <Container className="py-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 bg-white border-2 border-gray-100 rounded-3xl shadow-eventiphy-lg">
              <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Onze missie</h2>
              <p className="text-base text-gray-600 leading-relaxed">
                Eventiphy bestaat om feestplanning zorgeloos te maken — voor iedereen. Of je nu een intiem
                verjaardagsfeestje of een grote trouwdag organiseert, wij zorgen dat je snel de juiste mensen vindt,
                met vertrouwen boekt en vol verwachting naar je event kijkt. Één platform, geverifieerde professionals,
                volledige gemoedsrust.
              </p>
            </Card>

            <Card className="p-6 bg-white border-2 border-gray-100 rounded-3xl shadow-eventiphy-lg">
              <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Ons verhaal</h2>
              <p className="text-base text-gray-600 leading-relaxed">
                Eventiphy is geboren uit frustratie én een droom. We zagen hoe getalenteerde fotografen, DJ&apos;s en
                decorateurs in de schaduw bleven, puur door een gebrek aan naamsbekendheid. We zagen valse reviews die
                het vertrouwen braken, en klanten die verloren liepen — zonder overzicht, zonder houvast. Er moest een
                plek komen waar echte kwaliteit zichtbaar is.
              </p>
            </Card>

            <Card className="p-6 bg-white border-2 border-gray-100 rounded-3xl shadow-eventiphy-lg">
              <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Onze aanpak</h2>
              <p className="text-base text-gray-600 leading-relaxed">
                Vertrouwen is de kern van alles wat we doen. Elke aanbieder is geverifieerd en beoordeeld door echte
                klanten — geen nepprofelen, geen valse reviews. Ons beveiligde betalingssysteem houdt het geld veilig
                totdat de dienst daadwerkelijk geleverd is. Zo geven we nieuw talent een eerlijke kans — en boekt elke
                klant met een gerust hart.
              </p>
            </Card>
          </div>
        </Container>
      </Section>

      <Section background="gradient-feature" className="py-8 md:py-12">
        <Container className="py-0">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-3">
            Het <span className="gradient-text">Team</span> achter Eventiphy
          </h2>
          <p className="text-lg text-gray-600 text-center mb-6 max-w-3xl mx-auto">
            We werken elke dag aan een platform dat transparant, gebruiksvriendelijk en schaalbaar is.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => (
              <Card key={`${member.role}-${member.name}`} className="p-6 bg-white border-2 border-gray-100 rounded-3xl h-full">
                <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 mb-3">
                  {member.role}
                </Badge>
                <p className="text-base text-gray-600">{member.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="py-8 md:py-12">
        <Container className="py-0">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-3">
            Neem <span className="gradient-text">Contact</span> op
          </h2>
          <p className="text-lg text-gray-600 text-center mb-6 max-w-2xl mx-auto">
            Heb je vragen over Eventiphy, samenwerking of ondersteuning? We helpen je graag verder.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {contactItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="p-6 bg-white border-2 border-gray-100 rounded-3xl text-center">
                  <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  {item.href === '#' ? (
                    <p className="text-base text-gray-600">{item.value}</p>
                  ) : (
                    <a href={item.href} className="text-base text-purple-700 hover:text-purple-800 font-medium">
                      {item.value}
                    </a>
                  )}
                </Card>
              );
            })}
          </div>

          <Card className="p-6 bg-white border-2 border-gray-100 rounded-3xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Volg ons op</h3>
            <div className="flex items-center justify-center gap-3 mb-6">
              {socialItems.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="inline-flex items-center gap-2 px-4 h-11 rounded-xl border-2 border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    {social.label}
                  </a>
                );
              })}
            </div>
            <div className="flex justify-center">
              <Link href="/waitlist">
                <Button className="rounded-xl border-2 border-purple-400 text-purple-700 bg-white hover:bg-purple-50 transition-colors h-12 px-8 shadow-sm">
                  Join de wachtlijst
                </Button>
              </Link>
            </div>
          </Card>
        </Container>
      </Section>

      <Section className="py-6 md:py-8">
        <Container className="py-0">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <FileText className="w-4 h-4" />
            <Link
              href="/voorwaarden"
              className="text-purple-700 hover:text-purple-800 font-medium underline underline-offset-4"
            >
              Algemene Voorwaarden &amp; Privacyverklaring
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
