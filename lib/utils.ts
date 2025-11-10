// lib/utils.ts

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Export address parser functions
export { parseAddress, getGovernoratesData, getGovernorateNames, getCitiesByGovernorate } from './utils/addressParser';