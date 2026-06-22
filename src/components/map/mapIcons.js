import L from 'leaflet';

function buildIcon(label, className) {
  return L.divIcon({
    className: '',
    html: `<div class="${className}">${label}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

export const companyMarkerIcon = buildIcon(
  'E',
  'grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-orange-500 text-xs font-black text-white shadow-lg',
);

export const customerMarkerIcon = buildIcon(
  'C',
  'grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-slate-900 text-xs font-black text-white shadow-lg',
);

export const courierMarkerIcon = buildIcon(
  'M',
  'grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-emerald-500 text-xs font-black text-white shadow-lg',
);
