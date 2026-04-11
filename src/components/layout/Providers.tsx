"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

const NO_SHELL_PATHS = ["/", "/login", "/register"];

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noShell = NO_SHELL_PATHS.includes(pathname);

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#6366f1",
        },
        loginMethods: ["email", "google", "github", "wallet"],
      }}
    >
      {/* Ambient glow blobs shown on all "app" pages */}
      {!noShell && (
        <>
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-[#00C896]/5 blur-[140px]" />
            <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[350px] rounded-full bg-[#0040a0]/5 blur-[120px]" />
            <div className="absolute top-[40%] right-[5%] w-[350px] h-[350px] rounded-full bg-[#00C896]/3 blur-[120px]" />
          </div>
          <Navbar />
        </>
      )}
      <main className={`${noShell ? "" : "pt-16"} flex-1 relative z-10`}>
        {children}
      </main>
    </PrivyProvider>
  );
}
