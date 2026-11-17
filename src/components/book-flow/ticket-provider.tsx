import { createContext, type PropsWithChildren, use, useCallback, useEffect, useRef, useState } from 'react';

import { deleteSharedTicket, fetchSharedTickets, saveSharedTicket } from '@/services/ticket-database';
import type { LocalTicket } from '@/types/local-ticket';

const TicketContext = createContext<{
  tickets: LocalTicket[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  addTicket: (ticket: LocalTicket) => Promise<LocalTicket>;
  removeTicket: (id: string) => Promise<void>;
} | null>(null);

export function TicketProvider({ children }: PropsWithChildren) {
  const [tickets, setTickets] = useState<LocalTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const active = useRef(true);
  const requestId = useRef(0);
  const saveVersion = useRef(0);
  const load = useCallback(() => {
    const id = ++requestId.current;
    const version = saveVersion.current;
    return fetchSharedTickets().then((saved) => {
      if (active.current && id === requestId.current) {
        setError('');
        if (version === saveVersion.current) setTickets((current) => {
          const local = new Map(current.map((ticket) => [ticket.id, ticket]));
          return saved.map((ticket) => ({
            ...ticket,
            photoUri: local.get(ticket.id)?.photoUri ?? '',
          }));
        });
      }
    }).catch(() => {
      if (active.current && id === requestId.current) setError('Could not load shared books. Check your connection and retry.');
    }).finally(() => {
      if (active.current && id === requestId.current) setLoading(false);
    });
  }, []);
  useEffect(() => {
    active.current = true;
    void load();
    return () => { active.current = false; requestId.current += 1; };
  }, [load]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    await load();
  }, [load]);

  async function addTicket(ticket: LocalTicket) {
    const saved = await saveSharedTicket(ticket);
    saveVersion.current += 1;
    if (active.current) setTickets((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    return saved;
  }

  async function removeTicket(id: string) {
    await deleteSharedTicket(id);
    saveVersion.current += 1;
    if (active.current) setTickets((current) => current.filter((ticket) => ticket.id !== id));
  }

  return <TicketContext value={{ tickets, loading, error, refresh, addTicket, removeTicket }}>{children}</TicketContext>;
}

export function useTickets() {
  const context = use(TicketContext);
  if (!context) throw new Error('useTickets must be used inside TicketProvider');
  return context;
}
