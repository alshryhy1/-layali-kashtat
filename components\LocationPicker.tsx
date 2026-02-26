"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface LocationPickerProps {
    initialLat?: number;
    initialLng?: number;
    onLocationSelect: (lat: number, lng: number) => void;
    isAr: boolean;
}

function MapController({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, map.getZoom());
    }, [center, map]);
    return null;
}

function DraggableMarker({ position, setPosition, onDragEnd }: { 
    position: [number, number], 
    setPosition: (pos: [number, number]) => void,
    onDragEnd: (lat: number, lng: number) => void
}) {
    const markerRef = useRef<L.Marker>(null);

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const { lat, lng } = marker.getLatLng();
                    setPosition([lat, lng]);
                    onDragEnd(lat, lng);
                }
            },
        }),
        [onDragEnd, setPosition],
    );

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
        >
            <Popup minWidth={90}>
                <span>
                    Move me to adjust location
                </span>
            </Popup>
        </Marker>
    );
}

export default function LocationPicker({ initialLat, initialLng, onLocationSelect, isAr }: LocationPickerProps) {
    // Default to Riyadh if no location
    const defaultCenter: [number, number] = [24.7136, 46.6753];
    const [position, setPosition] = useState<[number, number]>(
        initialLat && initialLng ? [initialLat, initialLng] : defaultCenter
    );

    // Use controlled position if props are provided
    const controlledPosition: [number, number] = initialLat && initialLng ? [initialLat, initialLng] : position;

    return (
        <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e0e0e0', zIndex: 1 }}>
            <MapContainer center={controlledPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <DraggableMarker 
                    position={controlledPosition} 
                    setPosition={setPosition} 
                    onDragEnd={onLocationSelect} 
                />
                <MapController center={controlledPosition} />
            </MapContainer>
        </div>
    );
}
