import React, { useState } from 'react';
import { Place, Route } from '../types';

interface SidebarProps {
  places: Place[];
  selectedPlaces: Place[];
  route: Route | null;
  loading: boolean;
  error: string | null;
  onSearch: (city: string) => void;
  onPlaceSelect: (place: Place) => void;
  onPlaceRemove: (placeId: string) => void;
  onBuildRoute: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  places,
  selectedPlaces,
  route,
  loading,
  error,
  onSearch,
  onPlaceSelect,
  onPlaceRemove,
  onBuildRoute,
}) => {
  const [searchCity, setSearchCity] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCity.trim()) {
      onSearch(searchCity.trim());
    }
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} м`;
    } else {
      return `${(meters / 1000).toFixed(1)} км`;
    }
  };

  return (
    <div className="sidebar">
      {/* Секція пошуку */}
      <div className="search-section">
        <h2>Пошук місць</h2>
        <form onSubmit={handleSearchSubmit}>
          <input
            type="text"
            className="search-input"
            placeholder="Введіть назву міста (напр. Київ, Львів)"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
          />
          <button
            type="submit"
            className="search-button"
            disabled={loading || !searchCity.trim()}
          >
            {loading ? 'Завантаження...' : 'Знайти пам\'ятки'}
          </button>
        </form>
      </div>

      {/* Помилка */}
      {error && <div className="error">{error}</div>}

      {/* Список місць */}
      <div className="places-list">
        {loading && <div className="loading">Завантаження місць...</div>}

        {!loading && places.length === 0 && !error && (
          <div className="no-results">
            Введіть назву міста для пошуку туристичних місць
          </div>
        )}

        {!loading && places.length > 0 && (
          <>
            <h3 style={{ marginBottom: '1rem', color: '#333' }}>
              Знайдено місць: {places.length}
            </h3>
            {places.map(place => {
              const isSelected = selectedPlaces.some(p => p.id === place.id);

              return (
                <div
                  key={place.id}
                  className={`place-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => onPlaceSelect(place)}
                >
                  <h3>{place.name}</h3>
                  <span className="place-category">{place.category}</span>
                  {place.address && (
                    <p className="place-address">📍 {place.address}</p>
                  )}
                  {place.description && (
                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                      {place.description.substring(0, 100)}
                      {place.description.length > 100 ? '...' : ''}
                    </p>
                  )}
                  {isSelected && (
                    <div style={{ marginTop: '0.5rem', color: '#667eea', fontWeight: 600 }}>
                      ✓ Обрано
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Панель обраних місць та маршруту */}
      {selectedPlaces.length > 0 && (
        <div className="route-panel">
          <h2>Обрані місця ({selectedPlaces.length})</h2>

          <div className="selected-places-list">
            {selectedPlaces.map((place, index) => (
              <div key={place.id} className="selected-place-item">
                <span>
                  {index + 1}. {place.name}
                </span>
                <button
                  className="remove-button"
                  onClick={() => onPlaceRemove(place.id)}
                >
                  Видалити
                </button>
              </div>
            ))}
          </div>

          <button
            className="build-route-button"
            onClick={onBuildRoute}
            disabled={selectedPlaces.length < 2}
          >
            {selectedPlaces.length < 2
              ? 'Оберіть мінімум 2 місця'
              : 'Побудувати маршрут'}
          </button>

          {/* Інформація про маршрут */}
          {route && (
            <div className="route-info">
              <p>
                <strong>Загальна відстань:</strong> {formatDistance(route.totalDistance)}
              </p>
              <p>
                <strong>Кількість точок:</strong> {route.places.length}
              </p>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                Маршрут оптимізовано за відстанню
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
