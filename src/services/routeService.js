const OSRM_BASE_URL = import.meta.env.VITE_OSRM_BASE_URL ?? 'https://router.project-osrm.org';

function toCoordinate(point) {
  const latitude = Number(point?.latitude);
  const longitude = Number(point?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

export const routeService = {
  async getRoute(origin, destination) {
    const from = toCoordinate(origin);
    const to = toCoordinate(destination);

    if (!from || !to) {
      return [];
    }

    const coordinates = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
    const url = `${OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Não foi possível calcular a rota no OSRM.');
    }

    const data = await response.json();
    const route = data?.routes?.[0];
    const geometry = route?.geometry?.coordinates;

    if (!Array.isArray(geometry)) {
      return [];
    }

    return geometry.map(([longitude, latitude]) => ({ latitude, longitude }));
  },
};
