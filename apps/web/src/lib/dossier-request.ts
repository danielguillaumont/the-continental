/**
 * Bounded Dossier requests. A timeout means the outcome of a write is UNKNOWN:
 * the server may have committed it before the browser lost its response.
 */
export class DossierTimeoutError extends Error {
  constructor() {
    super("The Dossier request timed out. The server may still have saved the change.");
    this.name = "DossierTimeoutError";
  }
}

/** A completed 4xx response is a validation/client error, not a timeout. */
export class DossierHttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "DossierHttpError";
  }
}

export async function withDossierTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs = 15_000,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new DossierTimeoutError());
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation(controller.signal), deadline]);
  } catch (cause) {
    if (controller.signal.aborted) throw new DossierTimeoutError();
    throw cause;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
