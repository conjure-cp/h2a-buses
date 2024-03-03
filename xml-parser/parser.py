import os
import xml.etree.ElementTree as ET
import json

directory = f'{os.getcwd()}/test-data/stagecoach-scfi-route-schedule-data-transxchange'
tag_prefix='{http://www.transxchange.org.uk/}'

def extract_data(): 
    # F099S-None--SCFI-FI-2023-08-14-Fife_Timeplan_1408_2310-Transmill - Serviced Organisations?
    # F040-None--SCFI-FI-2023-08-14-Fife_Timeplan_1408_2310-Transmill - Serviced Organisations?
    available_lines = []
    for filename in os.listdir(directory):

        tree = ET.parse(os.path.join(directory, filename))

        root = tree.getroot()

        # If Serviced Organisation, no need to parse
        if root.find(f'{tag_prefix}ServicedOrganisations'):
            continue

        # Get the first RouteSection
        route_links = root.find(f'{tag_prefix}RouteSections').find(f'{tag_prefix}RouteSection').findall(f'{tag_prefix}RouteLink')
        num_links = len(route_links)

        bus_stop_locations = []
        for idx, link in enumerate(route_links):
            mapping = link.find(f'{tag_prefix}Track').find(f'{tag_prefix}Mapping')
            location = mapping.find(f'{tag_prefix}Location')
            lat = location.find(f'{tag_prefix}Latitude').text
            long = location.find(f'{tag_prefix}Longitude').text
            bus_stop_locations.append([float(lat), float(long)])
            
            # Append the last top as well
            if idx == num_links - 1:
                last_stop = mapping.findall(f'{tag_prefix}Location')[-1]
                bus_stop_locations.append([float(last_stop.find(f'{tag_prefix}Latitude').text), 
                                        float(last_stop.find(f'{tag_prefix}Longitude').text)])


        # Get Service Code, Origin and Destination info of the bus line
        bus_service = root.find(f'{tag_prefix}Services').find(f'{tag_prefix}Service')
        service_code = bus_service.find(f'{tag_prefix}ServiceCode').text
        line_name = bus_service.find(f'{tag_prefix}Lines').find(f'{tag_prefix}Line').find(f'{tag_prefix}LineName').text
        origin = bus_service.find(f'{tag_prefix}StandardService').find(f'{tag_prefix}Origin').text
        destination = bus_service.find(f'{tag_prefix}StandardService').find(f'{tag_prefix}Destination').text


        bus_line_details = {
            "service_code": service_code,
            "line_name": line_name,
            "origin": origin,
            "destination": destination,
            "stops": bus_stop_locations 
        }        

        available_lines.append(service_code)

        with open(f"{os.getcwd()}/public/json/{service_code}.json", "w+") as outfile:
            json.dump(bus_line_details, outfile, indent=2)
    
    with open(f"{os.getcwd()}/public/json/available_lines.json", "w+") as outfile:
        available_lines.sort() # sort elements in alphabetical order
        json.dump({ "lines": available_lines}, outfile, indent=2)


if __name__ == '__main__':
    extract_data()