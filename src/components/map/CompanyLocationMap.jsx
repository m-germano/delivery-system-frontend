import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import MapAutoFit from './MapAutoFit.jsx';
import { companyMarkerIcon } from './mapIcons.js';

function toPoint(address) {
  const latitude = Number(address?.latitude);
  const longitude = Number(address?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

export default function CompanyLocationMap({ company }) {
  const point = toPoint(company?.address);

  if (!point) {
    return (
      <div className="flex h-80 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm font-semibold text-slate-500">
        Endereço ainda não localizado no mapa.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <MapContainer center={[point.latitude, point.longitude]} zoom={15} scrollWheelZoom className="h-80 w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapAutoFit points={[point]} fallbackCenter={point} />
        <Marker position={[point.latitude, point.longitude]} icon={companyMarkerIcon}>
          <Popup>
            <strong>{company?.name ?? 'Empresa'}</strong>
            <br />
            {company?.address?.street}, {company?.address?.number}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
