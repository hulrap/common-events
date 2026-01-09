import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useRouter } from "next/router";

interface LayoutProps {
  readonly children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const isEventDetailPage = router.pathname.startsWith("/events/[id]");
  const isMapPage = router.pathname === "/map";

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-black antialiased">
      {!isEventDetailPage && !isMapPage && <Header />}
      <main className="flex flex-col flex-grow md:pb-0 pb-24">{children}</main>
      {!isMapPage && <Footer />}
    </div>
  );
}
