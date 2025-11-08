import { Container } from '@/components/layout';
import { Card } from '@/components/ui/card';

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Container className="py-12">
        <Card className="p-12 text-center border-2 border-gray-100 rounded-3xl">
          <div className="text-6xl mb-4">📖</div>
          <h1 className="text-3xl font-bold mb-4 gradient-text">Documentatie</h1>
          <p className="text-gray-600">
            Hier komt de volledige documentatie voor het gebruik van Eventify
          </p>
        </Card>
      </Container>
    </main>
  );
}
