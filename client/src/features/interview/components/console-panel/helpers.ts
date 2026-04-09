import { SessionPhase } from "../../types";
import { TabValue } from "./types";
import { TAB_ACCESSIBILITY, TAB_TOOLTIPS } from "./constants";

/**
 * Check if a tab is accessible based on the current phase
 */
export const isTabAccessible = (
  tabValue: TabValue,
  currentPhase: SessionPhase,
): boolean => {
  const accessibleTabs = TAB_ACCESSIBILITY[currentPhase];
  return accessibleTabs.includes(tabValue);
};

/**
 * Get the default tab for the current phase
 */
export const getDefaultTab = (currentPhase: SessionPhase): TabValue => {
  if (currentPhase === "PHASE_1_STRATEGY") {
    return "ai_chat";
  }
  return "testcase";
};

/**
 * Get tooltip for a tab if it's not accessible
 */
export const getTabTooltip = (
  tabValue: TabValue,
  currentPhase: SessionPhase,
): string | undefined => {
  if (
    !isTabAccessible(tabValue, currentPhase) &&
    currentPhase === "PHASE_1_STRATEGY"
  ) {
    return TAB_TOOLTIPS.PHASE_1_STRATEGY_LOCKED;
  }
  return undefined;
};

/**
 * Format test case status to display text
 */
export const formatTestCaseStatus = (status: string): string => {
  return status === "ACCEPTED" ? "✓ PASS" : "✗ FAIL";
};

/**
 * Check if test case status is a pass
 */
export const isTestCasePassed = (status: string): boolean => {
  return status === "ACCEPTED";
};

/**
 * Format timestamp to readable string
 */
export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

/**
 * Format memory from KB to MB
 */
export const formatMemoryToMB = (memoryKB: number): string => {
  return (memoryKB / 1024).toFixed(2);
};
