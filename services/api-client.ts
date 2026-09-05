import axios, { AxiosError } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export interface ApiErrorPayload {
  success: false;
  message: string;
  errorSources?: { path: string; message: string }[];
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = (error as AxiosError<ApiErrorPayload>).response?.data;
    if (data?.message) return data.message;

    const sources = data?.errorSources;
    if (sources?.length) {
      return sources.map((s) => s.message).join(". ");
    }

    if (error.code === "ERR_NETWORK") {
      return "Network error. Please check your connection and try again.";
    }

    return error.message;
  }

  return error instanceof Error
    ? error.message
    : "Unexpected error occurred. Please try again.";
}
