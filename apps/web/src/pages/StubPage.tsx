type StubPageProps = {
  title: string;
  description?: string;
};

export function StubPage({ title, description }: StubPageProps) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-2 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  );
}
