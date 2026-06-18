import { Suspense } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <span className="text-primary text-3xl font-bold tracking-tight">
          foodracoon
        </span>
      </div>
      <Suspense>{children}</Suspense>
    </main>
  );
}
