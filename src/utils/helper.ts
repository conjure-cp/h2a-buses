// IC, EV, Hydrogen
export const busIconColors = ["#fb5607", "#588157", "#3a86ff"];

export const busIconColorMap = new Map<string, string>([
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
