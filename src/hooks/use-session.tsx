"use client";

import { createContext, useContext, useMemo } from "react";

import type { Person } from "@/lib/types";

interface SessionContextValue {
  person: Person;
  ready: true;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  children,
  person,
}: {
  children: React.ReactNode;
  person: Person;
}) {
  const value = useMemo<SessionContextValue>(() => ({ person, ready: true }), [person]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}
