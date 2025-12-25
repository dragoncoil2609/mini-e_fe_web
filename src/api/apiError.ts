import type { AxiosError } from 'axios';

type BeErrorResponse = {
  success?: boolean;
  message?: unknown;
  error?: unknown;
  statusCode?: unknown;
};

export function getBeStatus(err: unknown): number | undefined {
  const status = (err as AxiosError | any)?.response?.status;
  return typeof status === 'number' ? status : undefined;
}

export function getBeMessage(err: unknown, fallback: string): string {
  const data = (err as AxiosError | any)?.response?.data as BeErrorResponse | undefined;
  const msg = data?.message;

  if (typeof msg === 'string' && msg.trim()) return msg.trim();
  if (Array.isArray(msg) && typeof msg[0] === 'string' && msg[0].trim()) return msg[0].trim();

  const alt = (err as any)?.message;
  if (typeof alt === 'string' && alt.trim()) return alt.trim();

  return fallback;
}


