import { useCallback, useEffect, useRef, useState } from 'react';
import { dleService } from '../services/dleServices';

export type AmcState = 'bihar' | 'up';

/* Best-guess shape for a street-light AMC record. Field names are assumed —
   confirm against a real API response and adjust this interface + the COLS
   array in AmcLightList.tsx if they differ. */
export interface AmcLightRecord {
  id: number | string;
  district: string;
  block: string;
  panchayat?: string;
  village?: string;
  wardNo?: string;
  poleNo: string;
  lightId: string;
  lightType?: string;
  capacityWatt?: string | number;
  make?: string;
  installDate?: string;
  lastMaintenanceDate?: string;
  status: string;            // "Working" | "Not Working" | "Faulty"
  complaintStatus?: string;  // "Open" | "Resolved" | "Pending"
  complaintRemarks?: string;
  image?: string;
  technicianName?: string;
  technicianContact?: string;
}

interface ApiEnvelope<T> {
  status?: boolean;
  success?: boolean;
  message?: string;
  data: T[];
}

interface UseAmcLightListResult {
  records: AmcLightRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAmcLightList(state: AmcState): UseAmcLightListResult {
  const [records, setRecords] = useState<AmcLightRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    const call = state === 'bihar'
      ? dleService.getBiharAmcLightList(controller.signal)
      : dleService.getUpAmcLightList(controller.signal);

    call
      .then((json: ApiEnvelope<AmcLightRecord>) => {
        if (json?.status === false || json?.success === false) {
          throw new Error(json.message || 'The server reported a failure.');
        }
        setRecords(Array.isArray(json?.data) ? json.data : []);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load AMC light data.');
        setRecords([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [state, tick]);

  return { records, loading, error, refetch };
}