import { busIconColors } from "@/utils/helper";
import L, { type LatLng, Marker, Layer } from "leaflet";
import "leaflet-routing-machine";

export const addedRoutesCoords: L.LatLng[][] = [];
export const addedRoutesCoordsReverse: L.LatLng[][] = [];
export const busMarkers: Marker[] = [];


// TODO: how to cache routes on the local storage?? VueUse!!
export const generateRoutingControl = (waypoints: L.LatLng[], map: L.Map) => {
  /**
   * This implementation relies on OSRM's demo server (https://router.project-osrm.org/route/v1) by default. 
   * At this moment, the demo server is no longer maintained, and its SSL certificate has expired. 
   * Therefore `leaflet-routing-machine` plugin might not work as expected unless we configure our own routing backend.
   */
  const routingControl = L.Routing.control({
    waypoints: waypoints,
    useZoomParameter: false,
    fitSelectedRoutes: 'smart',
    autoRoute: true,
    
    // Try also the matching algorithm
    router: L.Routing.osrmv1({
      serviceUrl: "https://routing.openstreetmap.de/routed-car/route/v1"
    })
  })
    .on("routesfound", (e) => {
      routesFoundCallback(e, map);
      addedRoutesCoords.push(e.routes[0].coordinates);
      addedRoutesCoordsReverse.push(e.routes[0].coordinates.slice().reverse());
    })
    .on("routingerror", (_err) => {
      console.log("An error occured while routing", _err);
      // throw(_err)
    });

  return routingControl;
};

export const routesFoundCallback = (e: any, map: L.Map) => {
  let waypointMarkers = new L.FeatureGroup();

  // add bus markers (3) to the starting point, representing a different engine type (IC, EV, Hybrid)
  for (let i = 0; i < busIconColors.length; i++) {
    const icon = L.divIcon({
      html: `<i class="fa-solid fa-bus fa-2xl" style="color: ${busIconColors[i]};"></i>`,
      className: `busIcon${i}`,
    });

    const marker = L.marker(
      [
        e.waypoints[0].latLng.lat + i / 1000,
        e.waypoints[0].latLng.lng + i / 1000,
      ],
      {
        icon: icon,
      }
    );
    busMarkers.push(marker);
    marker.addTo(map);
  }

  map.eachLayer((layer: Layer) => {
    if (
      layer instanceof Marker &&
      !layer.getIcon().options.className?.includes("bus")
    ) {
      waypointMarkers.addLayer(layer);
    }
  });

  // TODO: Solve this duplicate layer problem!
  map.addLayer(waypointMarkers);
  map.removeLayer(waypointMarkers);
};
