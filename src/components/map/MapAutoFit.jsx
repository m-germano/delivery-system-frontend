import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function MapAutoFit({ points = [], fallbackCenter }) {
  const map = useMap();

  useEffect(() => {
    const validPoints = points
      .map((point) => [Number(point?.latitude), Number(point?.longitude)])
      .filter(([latitude, longitude]) => Number.isFinite(latitude) && Number.isFinite(longitude));

    if (validPoints.length >= 2) {
      map.fitBounds(L.latLngBounds(validPoints), { padding: [40, 40], maxZoom: 16 });
      return;
    }

    if (validPoints.length === 1) {
      map.setView(validPoints[0], 15);
      return;
    }

    if (fallbackCenter) {
      map.setView([Number(fallbackCenter.latitude), Number(fallbackCenter.longitude)], 15);
    }
  }, [fallbackCenter, map, points]);

  return null;
}
