export interface BusLine {
  origin: string;
  destination: string;
  service_code: string;
  line_name: string;
  stops: number[][]; // dim: n x 2
}

export type RouteRegions =
  | "bluebird"
  | "east-scotland"
  | "highlands"
  | "west-scotland";

export type RouteOptionDetails = {
  line: string;
  origin: string;
  destination: string;
  serviceCode: string;
  waypoints: L.LatLng[];
  region: RouteRegions;
};

export type BusMarkerType = "IC" | "EV" | "Hydrogen";

export type BusType = BusMarkerType;

export type BusLaneRoute = {
  coordinates: L.LatLng[];
  totalDistance: number; // distance for the route, in meters
  totalTime: number; // estimated time for the route, in seconds
};
