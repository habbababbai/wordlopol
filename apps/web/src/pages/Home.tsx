import { AmbientBackground } from '../components/AmbientBackground';
import { HomeFeatureCards } from '../components/home/HomeFeatureCards';
import { HomeHero } from '../components/home/HomeHero';
import { HomeHowToPlay } from '../components/home/HomeHowToPlay';
import { useAuth } from '@/hooks/useAuth';

export function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative flex flex-1 flex-col">
      <AmbientBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-12 px-4 py-8 sm:gap-16 sm:py-12">
        <HomeHero isLoggedIn={isAuthenticated} />
        <HomeFeatureCards isLoggedIn={isAuthenticated} />
        <HomeHowToPlay />
      </div>
    </div>
  );
}
