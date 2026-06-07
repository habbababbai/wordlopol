import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';

const DevUiPage = import.meta.env.DEV
  ? lazy(() => import('./pages/DevUiPage').then((m) => ({ default: m.DevUiPage })))
  : null;

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {DevUiPage && (
        <Route
          path="/dev/ui"
          element={
            <Suspense fallback={null}>
              <DevUiPage />
            </Suspense>
          }
        />
      )}
    </Routes>
  );
}
