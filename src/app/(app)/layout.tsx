import { Nav } from "@/components/shell/Nav";
import { InstallBanner } from "@/components/shell/InstallBanner";
import { OnboardingFlow } from "@/components/shell/OnboardingFlow";
import { SplashScreen } from "@/components/shell/SplashScreen";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <Nav />
      <InstallBanner />
      <OnboardingFlow />
      <SplashScreen />
      <main className="relative h-full flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
