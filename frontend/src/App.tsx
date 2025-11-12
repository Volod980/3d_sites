import React, { useState } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import { Place, Route } from './types';
import tourApi from './services/api';
import './styles/App.css';

function App() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCity, setCurrentCity] = useState<string>('');

  // Пошук місць по місту
  const handleSearch = async (city: string) => {
    setLoading(true);
    setError(null);
    setPlaces([]);
    setSelectedPlaces([]);
    setRoute(null);
    setCurrentCity(city);

    try {
      const results = await tourApi.getPlacesByCity(city, 100);

      if (results.length === 0) {
        setError(`Не знайдено туристичних місць у місті "${city}". Спробуйте інше місто.`);
      } else {
        setPlaces(results);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Помилка при пошуку місць. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  // Вибір/зняття вибору місця
  const handlePlaceSelect = (place: Place) => {
    setSelectedPlaces(prev => {
      const isAlreadySelected = prev.some(p => p.id === place.id);

      if (isAlreadySelected) {
        // Видаляємо з обраних
        return prev.filter(p => p.id !== place.id);
      } else {
        // Додаємо до обраних
        return [...prev, place];
      }
    });

    // Скидаємо маршрут при зміні обраних місць
    setRoute(null);
  };

  // Видалення місця з обраних
  const handlePlaceRemove = (placeId: string) => {
    setSelectedPlaces(prev => prev.filter(p => p.id !== placeId));
    setRoute(null);
  };

  // Побудова маршруту
  const handleBuildRoute = async () => {
    if (selectedPlaces.length < 2) {
      alert('Оберіть мінімум 2 місця для побудови маршруту');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const placeIds = selectedPlaces.map(p => p.id);
      const routeResult = await tourApi.buildRoute(placeIds);

      if (routeResult) {
        setRoute(routeResult);
        // Оновлюємо порядок обраних місць відповідно до оптимізованого маршруту
        setSelectedPlaces(routeResult.places);
      } else {
        setError('Не вдалося побудувати маршрут');
      }
    } catch (err) {
      console.error('Route building error:', err);
      setError('Помилка при побудові маршруту');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>🗺️ Конструктор туристичних маршрутів</h1>
        <p>
          Знайдіть пам'ятки, музеї, парки та інші цікаві місця України та побудуйте
          оптимальний маршрут
        </p>
      </header>

      {/* Main content */}
      <div className="main-content">
        {/* Sidebar з пошуком та списком */}
        <Sidebar
          places={places}
          selectedPlaces={selectedPlaces}
          route={route}
          loading={loading}
          error={error}
          currentCity={currentCity}
          onSearch={handleSearch}
          onPlaceSelect={handlePlaceSelect}
          onPlaceRemove={handlePlaceRemove}
          onBuildRoute={handleBuildRoute}
        />

        {/* Карта */}
        <div className="map-container">
          <Map
            places={places}
            selectedPlaces={selectedPlaces}
            route={route}
            onPlaceClick={handlePlaceSelect}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
