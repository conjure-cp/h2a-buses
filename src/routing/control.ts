import { busIconColors } from "@/utils/helper";
import L, { type LatLng, Marker, Layer } from "leaflet";
import "leaflet-routing-machine";
import { storeToRefs } from "pinia";
import { useMapStore } from "@/stores/MapStore";

export const addedRoutesCoords: L.LatLng[][] = [];
export const addedRoutesCoordsReverse: L.LatLng[][] = [];
export const busMarkers: Marker[] = [];

const { demoMap: map } = storeToRefs(useMapStore())
const { createBusMarkers, removeWaypointMarkers } = useMapStore()

export const generateRoutingControl = (
  line: string,
  waypoints: L.LatLng[],
  mapArg?: L.Map,
) => {
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
      // Add route to map
      const route = new L.Polyline(e.routes[0].coordinates);
      routeFound(waypoints);
      route.addTo(map.value as L.Map);
      // Cache route coordinates
      localStorage.setItem(line, JSON.stringify(e.routes[0].coordinates));
      addedRoutesCoords.push(e.routes[0].coordinates);
      addedRoutesCoordsReverse.push(e.routes[0].coordinates.slice().reverse());

    })
    .on("routingerror", (_err) => {
      console.log("An error occured while routing", _err);
    });

  routingControl.route();
  return routingControl;
};

export const routeFound = (waypoints: L.LatLng[], map?: L.Map, e?: any) => {

  // add bus markers (3) to the starting point, representing a different engine type (IC, EV, Hybrid)
  // for (let i = 0; i < busIconColors.length; i++) {
  //   const icon = L.divIcon({
  //     html: `<i class="fa-solid fa-bus fa-2xl" style="color: ${busIconColors[i]};"></i>`,
  //     className: `busIcon${i}`,
  //   });

  //   const marker = L.marker(
  //     [waypoints[0].lat + i / 1000, waypoints[0].lng + i / 1000],
  //     {
  //       icon: icon,
  //     }
  //   );
  //   busMarkers.push(marker);
  //   marker.addTo(map);
  // }
  createBusMarkers(waypoints)

  // Remove waypoint markers

  // let waypointMarkers = new L.FeatureGroup();

  // map.eachLayer((layer: Layer) => {
  //   if (
  //     layer instanceof Marker &&
  //     !layer.getIcon().options.className?.includes("bus")
  //   ) {
  //     waypointMarkers.addLayer(layer);
  //   }
  // });

  // // TODO: Solve this duplicate layer problem!
  // map.addLayer(waypointMarkers);
  // map.removeLayer(waypointMarkers);
  removeWaypointMarkers()
};
