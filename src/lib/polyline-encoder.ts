// Función para codificar coordenadas en Google Encoded Polyline Format
export function encodePolyline(coordinates: [number, number][]): string {
  let lat = 0, lng = 0;
  let result = '';

  for (const [longitude, latitude] of coordinates) {
    const deltaLat = Math.round((latitude - lat) * 1e5);
    const deltaLng = Math.round((longitude - lng) * 1e5);
    
    lat = latitude;
    lng = longitude;
    
    result += encodeSignedNumber(deltaLat) + encodeSignedNumber(deltaLng);
  }
  
  return result;
}

function encodeSignedNumber(num: number): string {
  let sgn_num = num << 1;
  if (num < 0) {
    sgn_num = ~sgn_num;
  }
  return encodeNumber(sgn_num);
}

function encodeNumber(num: number): string {
  let result = '';
  while (num >= 0x20) {
    result += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
    num >>= 5;
  }
  result += String.fromCharCode(num + 63);
  return result;
}
