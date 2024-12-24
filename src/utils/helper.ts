// IC, EV, Hydrogen
export const busTypeColorMap = new Map<string, string>([
  ["IC", "#fb5607"],
  ["EV", "#588157"],
  ["Hydrogen", "#3a86ff"],
]);

export const regions = [
  "bluebird",
  "east-scotland",
  "highlands",
  "west-scotland",
];

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
export const getEmission = (emissionPerMile: number, distance: number) => {
  return emissionPerMile * distance;
};

// Linear cost functions for different bus types
export const getCost = (costPerMile: number, distance: number) => {
  return costPerMile * distance;
};

export const calculateAvg = (arr: number[]) => {
  if (arr.length === 0) {
    return 0;
  }
  return Number(
    (arr.reduce((prev, curr) => prev + curr) / arr.length).toFixed(2)
  );
};
