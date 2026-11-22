// จัดการสถานะโหลด ข้อผิดพลาด และการเรียก API ซ้ำตามช่วงเวลาที่กำหนด
import { useCallback, useEffect, useState } from 'react';

export function useApiResource(load, enabled, interval = 0) {
  const [state, setState] = useState(null);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => {
    setState(null);
    setRevision((value) => value + 1);
  }, []);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let timeout;
    async function run() {
      try {
        const data = await load(controller.signal);
        if (!controller.signal.aborted) setState({ load, data });
      } catch (failure) {
        if (!controller.signal.aborted) setState({ load, error: failure.message });
      } finally {
        if (!controller.signal.aborted && interval) timeout = setTimeout(run, interval);
      }
    }
    run();
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [load, enabled, interval, revision]);
  const current = enabled && state?.load === load ? state : null;
  return { data: current?.data, error: current?.error, loading: enabled && !current, refresh };
}
