/**
 * Utility Functions
 * Common utility functions used throughout the application
 * Includes Tailwind CSS class name merging and other helpers
 */
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | { [key: string]: any }
  | ClassValue[];

/**
 * Combines class names and merges Tailwind classes intelligently
 * Prevents conflicts between Tailwind classes (e.g., 'px-2 px-4' -> 'px-4')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Test function to verify path alias is working
 */
export const hello = () => {
  console.log("Hello AlgoMinds - Path alias working!");
  return "Hello AlgoMinds";
};

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Debounce function to limit API calls
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: any;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
