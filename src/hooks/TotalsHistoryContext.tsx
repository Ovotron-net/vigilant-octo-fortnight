import { createContext, useContext, type ReactNode } from "react";
import {
  useTotalsHistory,
  type TotalsHistory,
} from "@/hooks/useTotalsHistory";
import type { TotalsDto } from "@/api/types";

const TotalsHistoryContext = createContext<TotalsHistory | null>(null);

/**
 * Owns the totals ring buffer at the shell so Overview charts survive
 * navigation while AppShell continues polling.
 */
export function TotalsHistoryProvider({
  totals,
  dataUpdatedAt,
  children,
}: {
  totals: TotalsDto | undefined;
  dataUpdatedAt: number;
  children: ReactNode;
}) {
  const history = useTotalsHistory(totals, dataUpdatedAt);
  return (
    <TotalsHistoryContext.Provider value={history}>
      {children}
    </TotalsHistoryContext.Provider>
  );
}

export function useTotalsHistoryContext(): TotalsHistory {
  const ctx = useContext(TotalsHistoryContext);
  if (!ctx) {
    throw new Error("useTotalsHistoryContext requires TotalsHistoryProvider");
  }
  return ctx;
}
