import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

function parseDate(value: string) {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value);
}

/** Format a date-only or timestamp value for people, never for persistence. */
export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = parseDate(value);
  return Number.isNaN(date.getTime()) ? value : DATE_FORMAT.format(date);
}

/** Format a timestamp when the time is meaningful to the user. */
export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = parseDate(value);
  return Number.isNaN(date.getTime()) ? value : DATE_TIME_FORMAT.format(date);
}
