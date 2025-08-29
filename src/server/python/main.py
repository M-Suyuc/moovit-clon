import geopandas as gpd
import pandas as pd
import os
import fiona
import xml.etree.ElementTree as ET
from shapely.geometry import Point, LineString
from zipfile import ZipFile
from datetime import datetime, timedelta


def extract_agency_info_from_kml(kml_path: str) -> dict:
    """Extrae información de la agencia del documento KML"""
    try:
        tree = ET.parse(kml_path)
        root = tree.getroot()

        ns = {'kml': 'http://www.opengis.net/kml/2.2'}
        doc = root.find('.//kml:Document', ns)

        agency_info = {'name': 'Transmetro',
                       'description': 'Sistema de Transporte Masivo'}

        if doc is not None:
            name_elem = doc.find('kml:name', ns)
            desc_elem = doc.find('kml:description', ns)

            if name_elem is not None and name_elem.text:
                text = name_elem.text
                if 'Transmetro' in text:
                    agency_info['name'] = 'Transmetro'
                else:
                    agency_info['name'] = text.strip()

            if desc_elem is not None and desc_elem.text:
                agency_info['description'] = desc_elem.text.strip()

        return agency_info

    except Exception as e:
        print(f"⚠️ No se pudo extraer info de agencia del KML: {e}")
        return {'name': 'Transmetro', 'description': 'Sistema de Transporte Masivo'}


def read_all_layers(kml_path: str) -> gpd.GeoDataFrame:
    """Lee todas las capas del KML y las combina"""
    if not os.path.exists(kml_path):
        raise FileNotFoundError(f"No se encontró el archivo KML: {kml_path}")

    layers = fiona.listlayers(kml_path)
    print(f"Capas encontradas en el KML: {layers}")

    gdfs = []
    for layer_name in layers:
        try:
            gdf = gpd.read_file(kml_path, layer=layer_name)
            if not gdf.empty:
                gdf["layer_name"] = layer_name
                gdfs.append(gdf)
        except Exception as e:
            print(f"Error leyendo capa {layer_name}: {str(e)}")
            continue

    if not gdfs:
        raise ValueError("No se pudo leer ninguna capa del KML")

    return gpd.GeoDataFrame(pd.concat(gdfs, ignore_index=True), crs=gdfs[0].crs)


def process_kml(kml_path):
    """Convierte KML a GeoDataFrame procesado"""
    gdf = read_all_layers(kml_path)

    # Validar geometrías
    gdf = gdf[~gdf.geometry.is_empty & gdf.geometry.notna()]

    # Separar paradas (puntos) y rutas (líneas)
    stops = gdf[gdf.geometry.type == 'Point'].copy()
    routes = gdf[gdf.geometry.type == 'LineString'].copy()

    if stops.empty or routes.empty:
        raise ValueError(
            "El KML debe contener al menos un punto (parada) y una línea (ruta)")

    # Asignar IDs únicos
    stops['stop_id'] = range(1, len(stops)+1)
    routes['route_id'] = range(1, len(routes)+1)

    return stops, routes


def create_agency(kml_path):
    """Crea agency.txt extrayendo información del KML"""
    os.makedirs('gtfs_feed', exist_ok=True)

    agency_info = extract_agency_info_from_kml(kml_path)

    agency_data = pd.DataFrame({
        'agency_id': ['TRANSMETRO'],
        'agency_name': [agency_info['name']],
        'agency_url': ['https://www.transmetro.gob.gt'],
        'agency_timezone': ['America/Guatemala'],
        'agency_lang': ['es']
    })
    agency_data.to_csv('gtfs_feed/agency.txt', index=False)
    return agency_data


def create_stops(stops_gdf):
    """Crea stops.txt con información dinámica"""
    # Detectar columnas disponibles
    name_col = None
    desc_col = None

    for col in stops_gdf.columns:
        if col.lower() in ['name', 'nombre', 'stop_name']:
            name_col = col
        elif col.lower() in ['description', 'descripcion', 'desc']:
            desc_col = col

    stops = pd.DataFrame({
        'stop_id': stops_gdf['stop_id'],
        'stop_name': stops_gdf[name_col].fillna('Parada') if name_col else 'Parada',
        'stop_desc': stops_gdf[desc_col].fillna('') if desc_col else '',
        'stop_lat': [p.y for p in stops_gdf.geometry],
        'stop_lon': [p.x for p in stops_gdf.geometry],
        'location_type': 0,
        'parent_station': '',
        'stop_timezone': 'America/Guatemala',
        'wheelchair_boarding': 1
    })
    stops.to_csv('gtfs_feed/stops.txt', index=False)
    return stops


def create_routes(routes_gdf):
    """Crea routes.txt con información dinámica"""
    # Detectar columna de nombres
    name_col = None
    for col in routes_gdf.columns:
        if col.lower() in ['name', 'nombre', 'route_name', 'layer_name']:
            name_col = col
            break

    # Generar nombres de rutas
    if name_col:
        route_names = routes_gdf[name_col].fillna('Ruta').astype(str)
    else:
        route_names = [f"Ruta {i}" for i in range(1, len(routes_gdf)+1)]

    routes = pd.DataFrame({
        'route_id': routes_gdf['route_id'],
        'agency_id': ['TRANSMETRO']*len(routes_gdf),
        'route_short_name': route_names,
        'route_long_name': [f"{name} - Transmetro" for name in route_names],
        'route_type': [3]*len(routes_gdf),  # 3 = autobús
        'route_color': 'DB4436',
        'route_text_color': 'FFFFFF'
    })
    routes.to_csv('gtfs_feed/routes.txt', index=False)
    return routes


def create_shapes(routes_gdf):
    """Crea shapes.txt"""
    shapes = []
    for idx, row in routes_gdf.iterrows():
        line = row.geometry
        for seq, point in enumerate(line.coords):
            shapes.append({
                'shape_id': row['route_id'],
                'shape_pt_lat': point[1],
                'shape_pt_lon': point[0],
                'shape_pt_sequence': seq+1
            })
    shapes_df = pd.DataFrame(shapes)
    shapes_df.to_csv('gtfs_feed/shapes.txt', index=False)
    return shapes_df


def create_trips_and_stoptimes(stops, routes):
    """Crea trips.txt y stop_times.txt mejorado"""
    trips = []
    stop_times = []

    # Crear servicio básico
    service_id = 'WEEKDAY'
    calendar = pd.DataFrame({
        'service_id': [service_id],
        'monday': [1], 'tuesday': [1], 'wednesday': [1],
        'thursday': [1], 'friday': [1], 'saturday': [1], 'sunday': [1],
        'start_date': ['20240101'], 'end_date': ['20251231']
    })
    calendar.to_csv('gtfs_feed/calendar.txt', index=False)

    # Crear trips
    for _, route in routes.iterrows():
        trip_id = f"{route['route_id']}_TRIP1"
        trips.append({
            'route_id': route['route_id'],
            'service_id': 'WEEKDAY',
            'trip_id': trip_id,
            'shape_id': route['route_id'],
            'trip_headsign': f"Ruta {route['route_id']}",
            'direction_id': 0,
            'wheelchair_accessible': 1
        })

    trips_df = pd.DataFrame(trips)
    trips_df.to_csv('gtfs_feed/trips.txt', index=False)

    # Crear stop_times mejorado
    for trip in trips_df['trip_id']:
        route_id = int(trip.split('_')[0])

        # Obtener paradas cercanas a la ruta
        route_geom = routes[routes['route_id'] == route_id].iloc[0].geometry
        stops_near_route = stops[stops.geometry.apply(
            lambda p: route_geom.distance(p) < 0.01)]

        for seq, (_, stop) in enumerate(stops_near_route.iterrows()):
            arrival_time = f"{seq+6:02d}:00:00"
            departure_time = f"{seq+6:02d}:00:00"

            stop_times.append({
                'trip_id': trip,
                'arrival_time': arrival_time,
                'departure_time': departure_time,
                'stop_id': stop['stop_id'],
                'stop_sequence': seq+1,
                'pickup_type': 0,
                'drop_off_type': 0,
                'timepoint': 1
            })

    stop_times_df = pd.DataFrame(stop_times)
    stop_times_df.to_csv('gtfs_feed/stop_times.txt', index=False)

    return trips_df, stop_times_df


def create_feed_info():
    """Crea feed_info.txt"""
    today = datetime.now().strftime('%Y%m%d')
    next_year = (datetime.now() + timedelta(days=365)).strftime('%Y%m%d')

    feed_info = pd.DataFrame({
        'feed_publisher_name': ['MLS-Transport'],
        'feed_publisher_url': ['https://mls-transport.com'],
        'feed_lang': ['es'],
        'feed_contact_email': ["suyucmarlon02@gmail.com"],
        'feed_start_date': [today],
        'feed_end_date': [next_year],
        'feed_version': [f"1.0.{today}"]
    })
    feed_info.to_csv('gtfs_feed/feed_info.txt', index=False)
    return feed_info


def package_gtfs():
    """Empaqueta el feed GTFS en un archivo ZIP"""
    zip_filename = f'gtfs_feed_{datetime.now().strftime("%Y%m%d_%H%M%S")}.zip'

    with ZipFile(zip_filename, 'w') as zipf:
        for root, _, files in os.walk('gtfs_feed'):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, 'gtfs_feed')
                zipf.write(file_path, arcname)

    print(f"📦 Feed comprimido como: {zip_filename}")


def main(kml_path):
    """Función principal mejorada"""
    print("🚀 Iniciando conversión de KML a GTFS")

    try:
        # 1. Procesar KML
        stops_gdf, routes_gdf = process_kml(kml_path)

        # 2. Crear archivos GTFS
        create_feed_info()
        create_agency(kml_path)  # Pasamos kml_path en lugar de stops_gdf
        stops_df = create_stops(stops_gdf)
        routes_df = create_routes(routes_gdf)
        shapes_df = create_shapes(routes_gdf)
        trips_df, stop_times_df = create_trips_and_stoptimes(
            stops_gdf, routes_gdf)

        print("✅ Feed GTFS creado en la carpeta 'gtfs_feed'")
        print(f"- Paradas: {len(stops_df)}")
        print(f"- Rutas: {len(routes_df)}")
        print(f"- Viajes: {len(trips_df)}")
        print(f"- Horarios de parada: {len(stop_times_df)}")

        # 3. Empaquetar
        package_gtfs()

    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    try:
        main('./Transmetro-routes.kml')
    except Exception as e:
        print(f"❌ Error: {str(e)}")
