# Extract route data for each lane based on coordinate data fetched from json files

import os
import json
import requests
import typer

route_data_params = {
    "overview": "full",  # Options: full (default), simplified, false
    "geometries": "geojson",  # Geometry format: polyline (default) or geojson
    "steps": "true",  # Include detailed turn-by-turn instructions
}


def extract_route_data(region: str):
    coordinate_data_source = f"{os.getcwd()}/public/json/{region}"
    available_lines_source = f"{coordinate_data_source}/available_lines.json"
    available_lines = []
    with open(available_lines_source, "r") as file:
        available_lines.extend(json.loads(file.read())["lines"])

    for line in available_lines:
        with open(f"{coordinate_data_source}/{line}.json", "r") as file:
            data = json.loads(file.read())
            waypoints = data["stops"]
            route_data = dict()

            formatted_waypoints = ";".join(f"{lng},{lat}" for lat, lng in waypoints)
            url = f"https://routing.openstreetmap.de/routed-car/route/v1/driving/{formatted_waypoints}"

            response = requests.get(url, params=route_data_params)
            if response.status_code == 200:
                result = response.json()["routes"][0]

                route_data["line"] = data["service_code"]
                route_data["origin"] = data["origin"]
                route_data["destination"] = data["destination"]
                route_data["serviceCode"] = data["service_code"]
                route_data["routeData"] = dict(
                    totalDistance=result["distance"],
                    totalTime=result["duration"],
                    coordinates=[
                        dict(lat=lat, lng=lng)
                        for lng, lat in result["geometry"]["coordinates"]
                    ],
                )

                route_data_destination = f"{os.getcwd()}/public/route-data/{region}"

                if not os.path.exists(route_data_destination):
                    os.makedirs(route_data_destination)
                with open(
                    f'{route_data_destination}/{data["service_code"]}.json', "w"
                ) as file:
                    file.write(json.dumps(route_data, indent=2))
            else:
                print(
                    f"Failed to fetch route data for {line}, status_code: {response.status_code} err: {response.text}"
                )


if __name__ == "__main__":
    region = typer.prompt("Enter the region")
    print(f"Extracting route data for {region}")
    extract_route_data(region)
