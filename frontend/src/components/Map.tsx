import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Place, Route } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Виправлення іконок Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapProps {
  places: Place[];
  selectedPlaces: Place[];
  route: Route | null;
  onPlaceClick: (place: Place) => void;
}

// Компонент для автоматичного підлаштування меж карти
const MapBounds: React.FC<{ places: Place[] }> = ({ places }) => {
  const map = useMap();

  useEffect(() => {
    if (places.length > 0) {
      const bounds = L.latLngBounds(
        places.map(place => [place.latitude, place.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [places, map]);

  return null;
};

const Map: React.FC<MapProps> = ({ places, selectedPlaces, route, onPlaceClick }) => {
  // Центр України за замовчуванням
  const defaultCenter: [number, number] = [48.3794, 31.1656];
  const defaultZoom = 6;

  // Різні кольори для маркерів
  const createCustomIcon = (isSelected: boolean) => {
    return new L.Icon({
      iconUrl: isSelected
        ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'
        : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  };

  // Координати для маршруту
  const routeCoordinates: [number, number][] = route
    ? route.places.map(place => [place.latitude, place.longitude])
    : [];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Маркери місць */}
      {places.map(place => {
        const isSelected = selectedPlaces.some(p => p.id === place.id);

        return (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={createCustomIcon(isSelected)}
            eventHandlers={{
              click: () => onPlaceClick(place),
            }}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h3 style={{ margin: '0 0 8px 0' }}>{place.name}</h3>
                <p style={{ margin: '4px 0', fontSize: '0.9em', color: '#666' }}>
                  <strong>{place.category}</strong>
                </p>
                {place.address && (
                  <p style={{ margin: '4px 0', fontSize: '0.85em' }}>
                    📍 {place.address}
                  </p>
                )}
                {place.description && (
                  <p style={{ margin: '8px 0', fontSize: '0.85em' }}>
                    {place.description}
                  </p>
                )}
                {place.website && (
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.85em' }}
                  >
                    Веб-сайт
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Маршрут */}
      {routeCoordinates.length > 1 && (
        <Polyline
          positions={routeCoordinates}
          color="#667eea"
          weight={4}
          opacity={0.7}
        />
      )}

      {/* Автоматичне підлаштування меж */}
      <MapBounds places={places.length > 0 ? places : []} />
    </MapContainer>
  );
};

export default Map;
