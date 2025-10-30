/**
 * Утиліти для роботи з геолокацією
 */

const EARTH_RADIUS_KM = 6371; // Радіус Землі в кілометрах

/**
 * Обчислення відстані між двома точками за координатами
 * Використовується формула Гаверсинуса (Haversine formula)
 *
 * @param lat1 - широта першої точки
 * @param lon1 - довгота першої точки
 * @param lat2 - широта другої точки
 * @param lon2 - довгота другої точки
 * @returns відстань в метрах
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Переводимо градуси в радіани
  const lat1Rad = toRadians(lat1);
  const lon1Rad = toRadians(lon1);
  const lat2Rad = toRadians(lat2);
  const lon2Rad = toRadians(lon2);

  // Різниці координат
  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;

  // Формула Гаверсинуса
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Відстань в метрах
  const distanceKm = EARTH_RADIUS_KM * c;
  return distanceKm * 1000; // Конвертуємо в метри
}

/**
 * Конвертація градусів в радіани
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Конвертація радіанів в градуси
 */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Форматування відстані для відображення
 * @param meters - відстань в метрах
 * @returns відформатована відстань (наприклад, "2.5 км" або "350 м")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} м`;
  } else {
    return `${(meters / 1000).toFixed(1)} км`;
  }
}

/**
 * Обчислення центральної точки (центроїда) для набору координат
 * @param coordinates - масив координат [{latitude, longitude}]
 * @returns центральна точка {latitude, longitude}
 */
export function getCenterPoint(coordinates: Array<{ latitude: number; longitude: number }>): { latitude: number; longitude: number } {
  if (coordinates.length === 0) {
    return { latitude: 0, longitude: 0 };
  }

  if (coordinates.length === 1) {
    return coordinates[0];
  }

  let x = 0;
  let y = 0;
  let z = 0;

  for (const coord of coordinates) {
    const latRad = toRadians(coord.latitude);
    const lonRad = toRadians(coord.longitude);

    x += Math.cos(latRad) * Math.cos(lonRad);
    y += Math.cos(latRad) * Math.sin(lonRad);
    z += Math.sin(latRad);
  }

  const total = coordinates.length;
  x /= total;
  y /= total;
  z /= total;

  const lonRad = Math.atan2(y, x);
  const hyp = Math.sqrt(x * x + y * y);
  const latRad = Math.atan2(z, hyp);

  return {
    latitude: toDegrees(latRad),
    longitude: toDegrees(lonRad)
  };
}

/**
 * Перевірка чи знаходиться точка в межах заданого радіусу від центру
 */
export function isWithinRadius(
  centerLat: number,
  centerLon: number,
  pointLat: number,
  pointLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
  return distance <= radiusMeters;
}
