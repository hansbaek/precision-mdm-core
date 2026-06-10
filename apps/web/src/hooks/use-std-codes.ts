import { useEffect, useState } from 'react';
import { getStdCodes } from '@/api/stdCodes';
import type { StdCode } from '@/types';

export function useStdCodes(grpId: string, level?: number) {
  const [data, setData] = useState<StdCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let ignore = false;

    const loadStdCodes = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getStdCodes(grpId, level);
        if (!ignore) {
          setData(Array.isArray(result) ? result : []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err : new Error('Failed to load standard codes'));
          setData([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadStdCodes();

    return () => {
      ignore = true;
    };
  }, [grpId, level]);

  return { data, loading, error };
}
