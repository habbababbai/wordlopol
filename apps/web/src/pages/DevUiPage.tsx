import type { ReactNode } from 'react';

import { GamePlayDemo } from '../components/game/GamePlayDemo';
import { GameTile } from '../components/GameTile';
import { ThemeToggle } from '../components/ThemeToggle';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { ErrorCard, GameBoardSkeleton, Spinner } from '../components/ui/loader';
import { Input } from '../components/ui/input';
import { Toast } from '../components/ui/toast';
import type { ToastVariant } from '../components/ui/toast-types';
import { useToast } from '../hooks/useToast';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-bold tracking-widest whitespace-nowrap text-muted-foreground uppercase">
          {title}
        </h2>
        <div className="h-px flex-1 bg-border" />
      </div>
      {children}
    </section>
  );
}

const toastSamples: { variant: ToastVariant; message: string }[] = [
  { variant: 'success', message: 'Wygrana! Słowo odgadnięte w 4/6 próbach.' },
  { variant: 'warning', message: 'Nie ma takiego słowa w słowniku.' },
  { variant: 'error', message: 'Błąd połączenia. Sprawdź internet.' },
  { variant: 'info', message: 'Nowe słowo pojawi się za 06:24:18.' },
  { variant: 'dark', message: 'Za krótkie słowo — wpisz 5 liter' },
];

export function DevUiPage() {
  const { toast } = useToast();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1
          className="text-3xl font-bold tracking-tight text-foreground"
          style={{ fontFamily: 'var(--font-family-display)', fontStyle: 'italic' }}
        >
          Design system
        </h1>
        <ThemeToggle />
      </div>

      <Section title="Przyciski">
        <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-6">
          <Button>Graj dziś</Button>
          <Button variant="outline">Tryb nieskończony</Button>
          <Button variant="ghost">Udostępnij</Button>
          <Button variant="destructive">Usuń konto</Button>
          <Button disabled>Zablokowany</Button>
        </div>
      </Section>

      <Section title="Formularz">
        <Card>
          <CardHeader>
            <CardTitle>Logowanie</CardTitle>
            <CardDescription>Przykład karty z polem wejścia.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input type="email" placeholder="email@example.com" aria-label="Email" />
            <Input type="password" placeholder="Hasło" aria-label="Hasło" />
          </CardContent>
          <CardFooter>
            <Button className="w-full">Zaloguj</Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Kafelki">
        <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-end gap-4">
            {(['empty', 'filled', 'active', 'correct', 'present', 'absent'] as const).map(
              (state) => (
                <div key={state} className="flex flex-col items-center gap-2">
                  <GameTile letter={state === 'empty' ? '' : 'A'} state={state} size="md" />
                  <span className="text-[10px] text-muted-foreground capitalize">{state}</span>
                </div>
              ),
            )}
          </div>
          <div className="flex gap-1.5">
            {(['S', 'K', 'A', 'Ł', 'A'] as const).map((letter, index) => (
              <GameTile key={letter} letter={letter} state="correct" delay={index * 0.1} />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Gra">
        <div className="rounded-xl border border-border bg-card p-6">
          <GamePlayDemo />
        </div>
      </Section>

      <Section title="Odznaki">
        <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-6">
          <Badge variant="warning">Seria: 7</Badge>
          <Badge variant="success">Wygrana!</Badge>
          <Badge variant="accent">Rekord: 31</Badge>
          <Badge variant="muted">Zaloguj</Badge>
          <Badge variant="default">PL</Badge>
        </div>
      </Section>

      <Section title="Ładowanie">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="mb-3 text-xs text-muted-foreground">Skeleton</p>
            <GameBoardSkeleton />
          </div>
          <ErrorCard
            title="Błąd połączenia"
            message="Nie udało się załadować słowa."
            onRetry={() => toast({ message: 'Ponowiono próbę.', variant: 'info' })}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner size="sm" />
          Spinner
        </div>
      </Section>

      <Section title="Toasty">
        <div className="flex flex-col gap-3">
          {toastSamples.map((sample) => (
            <Toast key={sample.variant} message={sample.message} variant={sample.variant} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {toastSamples.map((sample) => (
            <Button
              key={`btn-${sample.variant}`}
              size="sm"
              variant="outline"
              onClick={() => toast({ message: sample.message, variant: sample.variant })}
            >
              {sample.variant}
            </Button>
          ))}
        </div>
      </Section>
    </div>
  );
}
