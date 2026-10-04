import type { RegisterPayload, RegisterResponse } from "@/types/registration";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function registerUser(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  const record = body as Record<string, unknown> | null;

  if (!res.ok) {
    const errorSources = record?.errorSources as
      | { path?: string; message?: string }[]
      | undefined;

    const message =
      (record?.message as string) ||
      errorSources?.map((e) => e.message).filter(Boolean).join(". ") ||
      `Registration failed with status ${res.status}`;

    return { success: false, message };
  }

  const data = record?.data as Record<string, unknown> | undefined;

  return {
    success: true,
    message: (record?.message as string) || undefined,
    redirectPath: (data?.redirectPath as string) || undefined,
  };
}
