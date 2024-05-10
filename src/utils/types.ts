export interface BusLine {
  origin: string;
  destination: string;
  service_code: string;
  line_name: string;
  stops: number[][]; // dim: n x 2
}

export type RouteOptions = {
  line: string;
  origin: string;
  destination: string;
  serviceCode: string;
  waypoints: L.LatLng[];
}

export type BusMarkerType = "IC" | "EV" | "Hybrid"

export type BusLaneRoute = {
  coordinates: L.LatLng[];
  totalDistance: number; // distance for the route, in meters
  totalTime: number; // estimated time for the route, in seconds
};
