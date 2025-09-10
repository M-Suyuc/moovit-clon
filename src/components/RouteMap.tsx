'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { getRouteStops } from '@/actions/get-route-stops';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Stop {
  stop_id: string;
  stop_name: string;
  lat: number;
  lng: number;
}

interface RouteMapProps {
  routeId?: string;
}

export default function RouteMap({ routeId }: RouteMapProps) {
  const [stops, setStops] = useState<Stop[]>([]);

  useEffect(() => {
    if (routeId) {
      getRouteStops(routeId).then(setStops);
    }
  }, [routeId]);

  return (
    <MapContainer
      center={[14.6349, -90.5069]}
      zoom={12}
      style={{ height: '500px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {stops.map(stop => (
        <Marker key={stop.stop_id} position={[stop.lat, stop.lng]}>
          <Popup>{stop.stop_name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
