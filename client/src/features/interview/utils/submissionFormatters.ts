/**
 * Helper functions for formatting submission data
 * Dùng chung cho các components liên quan đến submissions
 */

/**
 * Format memory from KB to MB
 */
export const formatMemory = (kb: number | null): string => {
  if (kb === null || kb === undefined) return "N/A";
  return `${(kb / 1000).toFixed(2)} MB`;
};

/**
 * Get color class for submission status
 */
export const getStatusColor = (status: string): string => {
  if (status === "ACCEPTED") return "text-emerald-500";
  return "text-rose-500";
};

/**
 * Format status text: ACCEPTED -> Accepted, COMPILE_ERROR -> Compile Error, etc.
 */
export const formatStatusText = (status: string): string => {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};
