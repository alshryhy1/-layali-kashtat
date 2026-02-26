"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (map) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
}

interface LiveMapProps {
    center: [number, number];
    zoom: number;
    carIconUrl?: string;
    providerPos?: [number, number];
    destPos?: [number, number];
    routePoints?: [number, number][];
    isAr: boolean;
    providerLabel?: string;
    destLabel?: string;
}

export default function LiveMap({
    center,
    zoom,
    carIconUrl,
    providerPos,
    destPos,
    routePoints,
    isAr,
    providerLabel,
    destLabel
}: LiveMapProps) {
    const carIcon = React.useMemo(() => {
        if (!carIconUrl) return null;
        return new L.Icon({
            iconUrl: carIconUrl,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16],
        });
    }, [carIconUrl]);

    return (
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
            <MapUpdater center={center} />
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {providerPos && carIcon && (
                <Marker position={providerPos} icon={carIcon}>
                    <Popup>
                        {providerLabel || (isAr ? "السائق" : "Driver")}
                    </Popup>
                </Marker>
            )}
            {destPos && (
                <Marker position={destPos}>
                    <Popup>
                        {destLabel || (isAr ? "الوجهة" : "Destination")}
                    </Popup>
                </Marker>
            )}
            {routePoints && routePoints.length > 0 && (
                <Polyline positions={routePoints} color="#2196F3" weight={4} />
            )}
        </MapContainer>
    );
}
