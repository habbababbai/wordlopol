import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ThemeToggle } from '../components/ThemeToggle';

export function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.getHealth(),
  });

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <h1
        className="text-5xl font-bold tracking-tight text-foreground"
        style={{ fontFamily: 'var(--font-family-display)', fontStyle: 'italic' }}
      >
        Wordlopol
      </h1>
      <p className="text-base text-muted-foreground">Polski Wordle — zgadnij słowo na 5 liter.</p>
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
    </main>
  );
}
