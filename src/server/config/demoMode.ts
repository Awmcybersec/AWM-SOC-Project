export const isDemoModeEnabled = (): boolean => {
  return process.env.ENABLE_DEMO_DATA === "true";
};