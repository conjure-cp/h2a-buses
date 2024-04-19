export interface BusLine {
  origin: string;
  destination: string;
  service_code: string;
  line_name: string;
  stops: number[][]; // dim: n x 2
}

export type RouteFoundEventData = {
  coordinates: L.LatLng[];
  totalDistance: number; // distance for the route, in meters
  totalTime: number; // estimated time for the route, in seconds
};
