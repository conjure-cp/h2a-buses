import L from "leaflet";
import "leaflet-routing-machine";
import { storeToRefs } from "pinia";
import { busTypeColorMap, downloadJSON } from "@/utils/helper";
import { useMapStore } from "@/stores/MapStore";
import type { BusLaneRoute, BusMarkerType, RouteOptions } from "@/utils/types";

export class BusLane {
  line?: string;
  origin?: string;
  destination?: string;
  serviceCode: string;
  routeData: BusLaneRoute;
  markers: Map<BusMarkerType, L.Marker[]> = new Map([
    ["EV", []],
    ["IC", []],
    ["Hydrogen", []],
  ]);
  get coordinatesReverse() {
    return this.routeData?.coordinates.slice().reverse();
  }
  get label() {
    return `${this.line} ${this.origin} - ${this.destination}`;
  }

  get numEVMarkers() {
    return this.markers.get("EV")?.length;
  }

  get numICMarkers() {
    return this.markers.get("IC")?.length;
  }

  get numHydrogenMarkers() {
    return this.markers.get("Hydrogen")?.length;
  }

  /**
   * Static method to return a fresh BusLane object using the information stored in localStorage
   * @param serviceCode
   * @returns BusLane
   */
  static async generateFromJSON(serviceCode: string) {

    try{
    const data = await(await fetch(`route-data/${serviceCode}.json`)).json() as BusLane
    
    return new BusLane({
      line: data.line,
      origin: data.origin,
      destination: data.destination,
      serviceCode: data.serviceCode,
      routeData: data.routeData,
    });
  } catch(err) {
    console.log('err occured while fetching route data from json', err)
    throw(err)
  }
  }

  constructor(data: {
    serviceCode: string;
    routeData: BusLaneRoute;
    line?: string;
    origin?: string;
    destination?: string;
  }) {
    this.serviceCode = data.serviceCode;
    this.routeData = data.routeData;
    this.line = data.line;
    this.origin = data.origin;
    this.destination = data.destination;
  }

  addMarker(type: BusMarkerType) {
    const { demoMap, addMarkerToMap } = useMapStore();
    const numMarkers = this.markers.get(type)?.length || 0;
    const icon = L.divIcon({
      html: `<i class="fa-solid fa-bus" style="color: ${busTypeColorMap.get(type)}; font-size: ${demoMap?.getZoom() ?? 13}px"></i>`,
      className: `busIcon-${type}-${this.serviceCode}-${numMarkers + 1}`,
    });

    const marker = L.marker(
      [
        this.routeData?.coordinates[0].lat! +
          this._mapMarkerTypeToIdx(type) / 5000,
        this.routeData?.coordinates[0].lng! +
          this._mapMarkerTypeToIdx(type) / 5000,
      ],
      {
        icon: icon,
        title: type
      }
    );

    this.markers.get(type)?.push(marker);
    addMarkerToMap(marker);
  }

  removeMarker(type: BusMarkerType, id: number) {
    const { removeBusMarker } = useMapStore();
    this.markers.get(type)?.pop();
    removeBusMarker(id, type, this.serviceCode);
  }

  // Very ugly solution to remove all markers
  removeAllMarkers() {
    this.markers.clear();
  }

  /**
   *
   * @param markerType : "IC" | "EV" | "Hydrogen"
   * @returns { 0, 1, 2}
   */
  _mapMarkerTypeToIdx(markerType: BusMarkerType) {
    return markerType === "IC" ? 0 : markerType === "EV" ? 1 : 2;
  }
}

export const generateRoutingControl = (data: RouteOptions) => {
  const { demoMap: map } = storeToRefs(useMapStore());
  const { addBusLane, removeWaypointMarkers } = useMapStore();
  /**
   * This implementation relies on OSRM's demo server (https://router.project-osrm.org/route/v1) by default.
   * At this moment, the demo server is no longer maintained, and its SSL certificate has expired.
   * Therefore `leaflet-routing-machine` plugin might not work as expected unless we configure our own routing backend.
   */
  const routingControl = L.Routing.control({
    waypoints: data.waypoints,
    useZoomParameter: false,
    fitSelectedRoutes: "smart",
    autoRoute: false,

    // TODO: Try also the matching algorithm
    router: L.Routing.osrmv1({
      serviceUrl: "https://routing.openstreetmap.de/routed-car/route/v1",
    }),
  })
    .on("routesfound", (e) => {
      const routeData: BusLaneRoute = {
        coordinates: e.routes[0].coordinates,
        totalDistance: e.routes[0].summary.totalDistance,
        totalTime: e.routes[0].summary.totalTime,
      };

      const busLane: BusLane = new BusLane({
        line: data.line,
        origin: data.origin,
        destination: data.destination,
        serviceCode: data.serviceCode,
        routeData: routeData,
      });

      // Add route to map
      const route = new L.Polyline(busLane.routeData.coordinates);
      removeWaypointMarkers();
      route.addTo(map.value as L.Map);

      // Download JSON - Uncomment and use it when the data needs to be saved as json
      // downloadJSON(data.serviceCode, JSON.stringify(busLane));

      // Add another entry to busLanes array
      addBusLane(busLane);
    })
    .on("routingerror", (_err) => {
      console.log("An error occured while routing", _err);
    });

  routingControl.route();
  return routingControl;
};
