"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getPerson } from "@/data/people";
import type { Person } from "@/lib/types";

const STORAGE_KEY = "ascend:pms:v1";

interface SessionContextValue {
  person: Person | null;
  ready: boolean;
  selectPerson: (personId: string) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function readStoredPersonId() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { session?: { userId?: string | null } };
    return parsed.session?.userId ?? null;
  } catch {
    return null;
  }
}

function writeStoredPersonId(personId: string | null) {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as Record<string, unknown>) : {};
    const session =
      typeof parsed.session === "object" && parsed.session !== null
        ? (parsed.session as Record<string, unknown>)
        : {};
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...parsed, version: 2, session: { ...session, userId: personId } }),
    );
  } catch {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, session: { userId: personId } }),
    );
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [person, setPerson] = useState<Person | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const personId = readStoredPersonId();
    setPerson(personId ? (getPerson(personId) ?? null) : null);
    setReady(true);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      person,
      ready,
      selectPerson(personId) {
        const nextPerson = getPerson(personId) ?? null;
        writeStoredPersonId(nextPerson?.id ?? null);
        setPerson(nextPerson);
      },
      signOut() {
        writeStoredPersonId(null);
        setPerson(null);
      },
    }),
    [person, ready],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}
