import { Container } from '@/components/layout';
import { Card } from '@/components/ui/card';

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Container className="py-12">
        <Card className="p-12 text-center border-2 border-gray-100 rounded-3xl">
          <div className="text-6xl mb-4">⚙️</div>
          <h1 className="text-3xl font-bold mb-4 gradient-text">Admin Dashboard</h1>
          <p className="text-gray-600 mb-2">
            Platform beheer en moderatie tools
          </p>
          <p className="text-sm text-gray-500">
            (Admin functionaliteit wordt in Fase 3 geïmplementeerd)
          </p>
        </Card>
      </Container>
    </main>
  );
}
