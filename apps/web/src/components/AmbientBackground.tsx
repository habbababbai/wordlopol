export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="amb-orb-1 absolute opacity-[0.18] dark:opacity-[0.055]"
        style={{
          top: '-10%',
          left: '-5%',
          width: '55vw',
          height: '55vw',
          maxWidth: 700,
          maxHeight: 700,
          background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
          filter: 'blur(60px)',
          willChange: 'transform',
        }}
      />

      <div
        className="amb-orb-2 absolute opacity-[0.13] dark:opacity-[0.045]"
        style={{
          bottom: '-15%',
          right: '-10%',
          width: '50vw',
          height: '50vw',
          maxWidth: 620,
          maxHeight: 620,
          background: 'radial-gradient(circle, var(--tile-correct) 0%, transparent 70%)',
          filter: 'blur(70px)',
          willChange: 'transform',
        }}
      />

      <div
        className="amb-orb-3 absolute opacity-[0.1] dark:opacity-[0.032]"
        style={{
          top: '35%',
          right: '10%',
          width: '35vw',
          height: '35vw',
          maxWidth: 440,
          maxHeight: 440,
          background: 'radial-gradient(circle, var(--tile-present) 0%, transparent 70%)',
          filter: 'blur(80px)',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
