interface AuthHeaderProps {
  title: React.ReactNode;
  subtitle: string;
}

export default function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="mb-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ape-lime to-ape-emerald font-display text-lg font-bold text-void shadow-glow-lime">
        LV
      </div>
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted">{subtitle}</p>
    </div>
  );
}
