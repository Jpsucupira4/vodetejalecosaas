import { useState, useCallback, useRef } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    timerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  return { toast, showToast };
}
