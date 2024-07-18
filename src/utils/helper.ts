import type { BusType } from "./types";

// IC, EV, Hydrogen
export const busTypeColorMap = new Map<string, string>([
  ["IC", "#fb5607"],
  ["EV", "#588157"],
  ["Hydrogen", "#3a86ff"],
]);

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const downloadJSON = (fileName: string, jsonString: string) => {
  // Convert JSON data to a Blob
  const blob = new Blob([jsonString], { type: "application/json" });

  // Create a download link
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.json`; // The filename for the downloaded file

  // Click the download link
  link.click();

  // Clean up the URL object
  URL.revokeObjectURL(link.href);
};

// Linear emission functions for different bus types
export const getEmission = (type: BusType, distance: number) => {
  switch (type) {
    case "IC":
      return 2 * distance;

    case "EV":
      return 0.5 * distance;

    case "Hydrogen":
      return 1 * distance;

    default:
      return 0;
  }
};

// Linear cost functions for different bus types
// TODO: double-check if the cost function should be parametrized by distance
export const getCost = (type: BusType, distance: number) => {
  switch (type) {
    case "IC":
      return 3 * distance;

    case "EV":
      return 2 * distance;

    case "Hydrogen":
      return 2.5 * distance;

    default:
      return 0;
  }
};
