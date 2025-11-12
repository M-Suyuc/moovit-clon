export function generateSectorImageUrl(
  coordinates: string,
  centerLon: string,
  centerLat: string,
  zoom: string | number = 12
) {
  // osm-bright
  // const baseUrl = `http://localhost:8080/styles/maptiler-basic/static/${centerLon},${centerLat},${zoom}/360x360.webp?path=fill:rgba(103,58,183,0.20)|stroke:rgba(103,58,183,0.8)|width:1|`;

  const baseUrl = `http://localhost:8080/styles/maptiler-basic/static/auto/360x360.webp?path=fill:rgba(103,58,183,0.20)|stroke:rgba(103,58,183)|width:1|`;

  return `${baseUrl}${coordinates}`;
}
