import type { ReactNode } from "react";

import { BrandLogo } from "@/app/components/brand-logo";

/**
 * Full-viewport shell for the signed-out pages (sign in, change password,
 * setup required). Dark brand slab, brand-blue glow, and the wordmark above
 * whatever card the page supplies.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-sidebar px-4 py-12">
      <div className="auth-glow absolute inset-0" />
      <div className="relative z-10 mx-auto w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <BrandLogo on="dark" className="h-16" />
        </div>
        {children}
      </div>
    </main>
  );
}
