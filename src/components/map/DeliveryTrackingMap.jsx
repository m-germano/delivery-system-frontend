import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import MapAutoFit from './MapAutoFit.jsx';
import { companyMarkerIcon, courierMarkerIcon, customerMarkerIcon } from './mapIcons.js';

function toPoint(entity) {
  const latitude = Number(entity?.latitude);
  const longitude = Number(entity?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

function toLatLng(point) {
  return [Number(point.latitude), Number(point.longitude)];
}

export default function DeliveryTrackingMap({ snapshot, routeCoordinates = [] }) {
  const companyPoint = toPoint(snapshot?.company);
  const customerPoint = toPoint(snapshot?.customer);
  const courierPoint = toPoint(snapshot?.courier_location);
  const points = [companyPoint, customerPoint, courierPoint].filter(Boolean);
  const center = courierPoint ?? companyPoint ?? customerPoint ?? { latitude: -23.55052, longitude: -46.633308 };
  const routePositions = routeCoordinates
    .map((point) => [Number(point.latitude), Number(point.longitude)])
    .filter(([latitude, longitude]) => Number.isFinite(latitude) && Number.isFinite(longitude));

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm">
      <MapContainer center={toLatLng(center)} zoom={14} scrollWheelZoom className="h-[420px] w-full md:h-[520px]">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapAutoFit points={points} fallbackCenter={center} />

        {routePositions.length > 1 ? <Polyline positions={routePositions} weight={5} opacity={0.75} /> : null}

        {companyPoint ? (
          <Marker position={toLatLng(companyPoint)} icon={companyMarkerIcon}>
            <Popup>
              <strong>{snapshot?.company?.name ?? 'Empresa'}</strong>
              <br />
              {snapshot?.company?.address ?? 'Retirada'}
            </Popup>
          </Marker>
        ) : null}

        {customerPoint ? (
          <Marker position={toLatLng(customerPoint)} icon={customerMarkerIcon}>
            <Popup>
              <strong>Endereço de entrega</strong>
              <br />
              {snapshot?.customer?.address ?? 'Destino'}
            </Popup>
          </Marker>
        ) : null}

        {courierPoint ? (
          <Marker position={toLatLng(courierPoint)} icon={courierMarkerIcon}>
            <Popup>
              <strong>Entregador</strong>
              <br />
              Localização atual
            </Popup>
          </Marker>
        ) : null}
      </MapContainer>
    </div>
  );
}
