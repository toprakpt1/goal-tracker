import type { SQLiteDatabase } from 'expo-sqlite';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';

import { useDbStore } from '@/store/db';

export interface DbQueryState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  reload: () => void;
}

interface QueryResult<T> {
  key: string;
  data: T | null;
  error: Error | null;
}

/**
 * Runs a read query against the shared database and re-runs it whenever the
 * data version changes or `reloadKey` changes (for example at midnight).
 *
 * The request key is derived during render, so the "loading" flag never needs
 * a synchronous setState inside an effect. Previous data stays on screen while
 * a new request is in flight.
 */
export function useDbQuery<T>(
  query: (db: SQLiteDatabase) => Promise<T>,
  reloadKey: string,
): DbQueryState<T> {
  const db = useSQLiteContext();
  const version = useDbStore((state) => state.version);
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<QueryResult<T>>({ key: '', data: null, error: null });

  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  });

  const requestKey = `${version}:${reloadKey}:${nonce}`;
  const isStale = result.key !== requestKey;

  useEffect(() => {
    let active = true;

    queryRef
      .current(db)
      .then((data) => {
        if (active) {
          setResult({ key: requestKey, data, error: null });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setResult({
            key: requestKey,
            data: null,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [db, requestKey]);

  return {
    data: result.data,
    error: isStale ? null : result.error,
    loading: isStale,
    reload: () => setNonce((value) => value + 1),
  };
}
