import { Nav } from "@/components/shell/Nav";
import { InstallBanner } from "@/components/shell/InstallBanner";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <Nav />
      <InstallBanner />
      <main className="relative h-full flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
