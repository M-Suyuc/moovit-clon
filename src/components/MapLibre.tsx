"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapLibre, Marker } from "maplibre-gl";
import { getRoutes } from '@/actions/get-routes';


interface MapProps {
  style: any;
}

interface Route {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: number;
}

export function Map({ style }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);

  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');

  useEffect(() => {
    getRoutes().then(setRoutes);
  }, []);


  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new MapLibre({
      container: mapContainer.current,
      style: "http://localhost:8080/styles/osm-bright/style.json",
      center: [-90.5133, 14.6407], // ejemplo: Guatemala
      zoom: 11,
    });

    // =========
    new Marker()
      .setLngLat([0, 0])
      .addTo(map);
    // =========

    return () => map.remove();
  }, [style]);



  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Mapa de Rutas</h1>

      <div className="mb-4">
        <select
          value={selectedRoute}
          onChange={(e) => setSelectedRoute(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="" className='text-black'>Selecciona una ruta</option>
          {routes.map(route => (
            <option key={route.route_id} value={route.route_id} className='text-black'>
              {route.route_short_name} - {route.route_long_name}
            </option>
          ))}
        </select>
      </div>

      <div ref={mapContainer} className="w-full h-[600px]" />;
      {/* <TileLayer url="http://localhost:8080/styles/bright/{z}/{x}/{y}.png" /> */}

      {/* <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {stops.map(stop => (
        <Marker key={stop.stop_id} position={[stop.lat, stop.lng]}>
          <Popup>{stop.stop_name}</Popup>
        </Marker>
      ))} */}

    </>
  )
}
