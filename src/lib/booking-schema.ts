import { z } from "zod";

export const bookingSchema = z.object({
  typeId: z.string().min(1, "Выбери услугу"),
  startAt: z.string().datetime({ message: "Выбери время" }),
  name: z.string().trim().min(2, "Как тебя зовут?").max(80),
  phone: z
    .string()
    .trim()
    .min(6, "Укажи телефон для связи")
    .max(20)
    .regex(/^[+\d][\d\s()-]+$/, "Похоже на опечатку в телефоне"),
  telegram: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Проверь email")
    .optional()
    .or(z.literal("")),
  size: z.enum(["S", "M", "L"], { message: "Выбери размер" }),
  bodyPart: z.string().trim().min(2, "Место на теле").max(60),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const SIZE_LABELS: Record<"S" | "M" | "L", string> = {
  S: "S · до 10 см",
  M: "M · 10–20 см",
  L: "L · больше 20 см",
};
