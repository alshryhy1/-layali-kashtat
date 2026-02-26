"use client";

import { useEffect, useRef } from "react";

type Props = {
  customer?: { lat: number; lng: number } | null;
  provider?: { lat: number; lng: number } | null;
  polyline?: [number, number][] | null;
};

export default function LiveMap({ customer, provider, polyline }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: any;
    let Lmod: any;
    let customerMarker: any;
    let providerMarker: any;
    let line: any;
    let ready = false;
    const init = async () => {
      const L = await import("leaflet");
      Lmod = L;
      const DefaultIcon: any = (L as any).Icon.Default;
      delete DefaultIcon.prototype._getIconUrl;
      DefaultIcon.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
      map = L.map(ref.current as HTMLDivElement);
      const lat = customer?.lat || provider?.lat || 24.7136;
      const lng = customer?.lng || provider?.lng || 46.6753;
      map.setView([lat, lng], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "",
      }).addTo(map);
      ready = true;
      if (customer) {
        customerMarker = L.marker([customer.lat, customer.lng]).addTo(map);
      }
      if (provider) {
        providerMarker = L.marker([provider.lat, provider.lng]).addTo(map);
      }
      if (polyline && polyline.length >= 2) {
        line = L.polyline(polyline, { color: "blue" }).addTo(map);
        map.fitBounds(line.getBounds(), { padding: [20, 20] });
      }
    };
    init();
    return () => {
      try {
        if (map) map.remove();
      } catch {}
    };
  }, [customer, provider, polyline]);
  return <div ref={ref} style={{ width: "100%", height: 240, borderRadius: 16 }} />;
}
