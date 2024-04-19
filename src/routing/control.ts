import L from "leaflet";
import "leaflet-routing-machine";
import { storeToRefs } from "pinia";
import { useMapStore } from "@/stores/MapStore";
import type { RouteFoundEventData } from "@/utils/types";

export const generateRoutingControl = (
  serviceCode: string,
  waypoints: L.LatLng[]
) => {
  const { demoMap: map } = storeToRefs(useMapStore());
  const { addRouteCoords } = useMapStore();
  /**
   * This implementation relies on OSRM's demo server (https://router.project-osrm.org/route/v1) by default.
   * At this moment, the demo server is no longer maintained, and its SSL certificate has expired.
   * Therefore `leaflet-routing-machine` plugin might not work as expected unless we configure our own routing backend.
   */
  const routingControl = L.Routing.control({
    waypoints: waypoints,
    useZoomParameter: false,
    fitSelectedRoutes: "smart",
    autoRoute: false,

    // TODO: Try also the matching algorithm
    router: L.Routing.osrmv1({
      serviceUrl: "https://routing.openstreetmap.de/routed-car/route/v1",
    }),
  })
    .on("routesfound", (e) => {
      const routeData: RouteFoundEventData = {
        coordinates: e.routes[0].coordinates,
        totalDistance: e.routes[0].summary.totalDistance,
        totalTime: e.routes[0].summary.totalTime,
      };

      // Add route to map
      const route = new L.Polyline(routeData.coordinates);
      routeFound(waypoints);
      route.addTo(map.value as L.Map);
      // Cache route coordinates
      localStorage.setItem(serviceCode, JSON.stringify(routeData));

      // Populate `addedRoutesCoords` arrays
      addRouteCoords(routeData.coordinates);
    })
    .on("routingerror", (_err) => {
      console.log("An error occured while routing", _err);
    });

  routingControl.route();
  return routingControl;
};

export const routeFound = (waypoints: L.LatLng[]) => {
  const { createBusMarkers, removeWaypointMarkers } = useMapStore();

  createBusMarkers(waypoints);

  removeWaypointMarkers();
};
