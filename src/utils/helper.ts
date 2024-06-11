// IC, EV, Hybrid
export const busIconColors = ["#fb5607", "#588157", "#3a86ff"];

export const busIconColorMap = new Map<string, string>([
  ["IC", "#fb5607"],
  ["EV", "#588157"],
  ["Hybrid", "#3a86ff"],
]);

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};