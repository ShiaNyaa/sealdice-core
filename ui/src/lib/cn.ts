import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind 类名合并：后出现的冲突类覆盖先出现的。 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
