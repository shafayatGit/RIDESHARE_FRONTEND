const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

interface ErrorSource {
  path: string;
  message: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  errorSources?: ErrorSource[];
}

export class ApiError extends Error {
  statusCode: number;
  errorSources: ErrorSource[];

  constructor(message: string, statusCode: number, errorSources: ErrorSource[] = []) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorSources = errorSources;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body: ApiEnvelope<T> | undefined = isJson ? await res.json() : undefined;

  if (!res.ok || !body?.success) {
    throw new ApiError(
      body?.message ?? `Request failed with status ${res.status}`,
      res.status,
      body?.errorSources ?? [],
    );
  }

  return body.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export { API_BASE_URL };
