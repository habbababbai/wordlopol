import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.getHealth(),
  });

  return (
    <main className="home">
      <h1>Wordlopol</h1>
      <p>Polski Wordle — zgadnij słowo na 5 liter.</p>
      <p className="status">
        {isLoading && 'Łączenie z API...'}
        {error && 'API niedostępne'}
        {data && `API: ${data.status}`}
      </p>
      <p className="coming-soon">Gra wkrótce — Phase 2+</p>
    </main>
  );
}
