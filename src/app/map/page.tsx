'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { getRoutes } from '@/actions/get-routes';

const RouteMap = dynamic(() => import('@/components/RouteMap'), {
  ssr: false
});

interface Route {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: number;
}

export default function MapPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');

  useEffect(() => {
    getRoutes().then(setRoutes);
  }, []);

  return (
    <div className="p-4">
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

      <RouteMap routeId={selectedRoute} />

    </div>
  );
}
