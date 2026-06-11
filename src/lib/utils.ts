import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number | null | undefined) {
  if (value == null) return "по запросу";
  return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
}
