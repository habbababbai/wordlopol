import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { api } from '../api/client';
import { Button } from '../components/ui/button';

export function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.getHealth(),
  });

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="flex flex-col gap-2">
        <h1
          className="text-5xl font-bold tracking-tight text-foreground"
          style={{ fontFamily: 'var(--font-family-display)', fontStyle: 'italic' }}
        >
          Wordlopol
        </h1>
        <p className="text-base text-muted-foreground">Polski Wordle — zgadnij słowo na 5 liter.</p>
      </div>

      <Button asChild size="lg">
        <Link to="/daily">Graj dziś</Link>
      </Button>

      <p
        className="text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {isLoading && 'Łączenie z API...'}
        {error && 'API niedostępne'}
        {data && `API: ${data.status}`}
      </p>
    </div>
  );
}
