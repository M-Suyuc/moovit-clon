interface ImageOptions {
  coordinates?: string;
  centerLon?: string;
  centerLat?: string;
  zoom?: string | number;
}

interface RouteImageOptions extends ImageOptions {
  markes?: string;
  encodedPath?: string;
}

export function generateSectorImageUrl({ coordinates }: ImageOptions) {
  // osm-bright
  // const baseUrl = `http://localhost:8080/styles/maptiler-basic/static/${centerLon},${centerLat},${zoom}/550x540.webp?path=fill:rgba(103,58,183,0.20)|stroke:rgba(103,58,183,0.8)|width:1|`;

  const baseUrl = `http://localhost:8080/styles/maptiler-basic/static/auto/550x540.webp?path=fill:rgba(103,58,183,0.20)|stroke:rgba(103,58,183)|width:1|`;

  return `${baseUrl}${coordinates}`;
}

export function generateRouteImageUrl({
  markes,
  encodedPath,
}: RouteImageOptions) {
  // const baseUrl = `http://localhost:8080/styles/maptiler-basic/static/auto/550x540.webp?path=stroke:rgba(233,30,99)|width:2|`;
  // return `${baseUrl}${coordinates}${markes}&border=rgba(0,0,0,.8)&borderwidth=1.5`;

  const baseUrl = `http://localhost:8080/styles/maptiler-basic/static/auto/550x540.webp`;

  if (encodedPath) {
    return `${baseUrl}?path=stroke:rgba(233,30,99)|width:2|enc:${encodedPath}${
      markes || ""
    }&border=rgba(0,0,0,.8)&borderwidth=1.5`;
  }

  return;
}

// rgba(255,193,7)
// rgba(0,1226,255)
// rgba(233,30,99)
