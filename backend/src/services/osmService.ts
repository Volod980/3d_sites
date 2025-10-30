import axios from 'axios';
import { Place, PlaceType, SearchParams } from '../types';

const OVERPASS_API_URL = process.env.OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter';
const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org';

/**
 * Координати центрів українських міст (fallback)
 */
const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'Київ': { lat: 50.4501, lon: 30.5234 },
  'Львів': { lat: 49.8397, lon: 24.0297 },
  'Одеса': { lat: 46.4825, lon: 30.7233 },
  'Харків': { lat: 49.9935, lon: 36.2304 },
  'Дніпро': { lat: 48.4647, lon: 35.0462 },
  'Запоріжжя': { lat: 47.8388, lon: 35.1396 },
  'Вінниця': { lat: 49.2328, lon: 28.4681 },
  'Полтава': { lat: 49.5883, lon: 34.5514 },
  'Чернігів': { lat: 51.4982, lon: 31.2893 },
  'Черкаси': { lat: 49.4444, lon: 32.0598 },
  'Суми': { lat: 50.9077, lon: 34.7981 },
  'Житомир': { lat: 50.2649, lon: 28.6767 },
  'Хмельницький': { lat: 49.4229, lon: 26.9871 },
  'Рівне': { lat: 50.6199, lon: 26.2516 },
  'Чернівці': { lat: 48.2908, lon: 25.9351 },
  'Івано-Франківськ': { lat: 48.9226, lon: 24.7111 },
  'Тернопіль': { lat: 49.5535, lon: 25.5948 },
  'Луцьк': { lat: 50.7472, lon: 25.3254 },
  'Ужгород': { lat: 48.6167, lon: 22.2833 },
  'Кам\'янець-Подільський': { lat: 48.6827, lon: 26.5850 }
};

/**
 * Сервіс для роботи з OpenStreetMap Overpass API
 * Знаходить туристичні місця в Україні
 */
export class OSMService {
  /**
   * Отримання координат міста (спочатку з кешу, потім через Nominatim)
   */
  async getCityCoordinates(cityName: string): Promise<{ lat: number; lon: number } | null> {
    // Спочатку перевіряємо кеш
    if (CITY_COORDINATES[cityName]) {
      return CITY_COORDINATES[cityName];
    }

    // Якщо немає в кеші, пробуємо через Nominatim
    try {
      const response = await axios.get(`${NOMINATIM_API_URL}/search`, {
        params: {
          q: `${cityName}, Україна`,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'TourBuilderApp/1.0'
        },
        timeout: 10000
      });

      if (response.data && response.data.length > 0) {
        return {
          lat: parseFloat(response.data[0].lat),
          lon: parseFloat(response.data[0].lon)
        };
      }
    } catch (error) {
      console.error('Error geocoding city:', error);
    }

    return null;
  }
  /**
   * Пошук туристичних місць за параметрами
   */
  async searchPlaces(params: SearchParams): Promise<Place[]> {
    let searchParams = { ...params };

    // Якщо вказано місто, але немає координат - знаходимо координати
    if (params.city && !params.latitude && !params.longitude) {
      const coords = await this.getCityCoordinates(params.city);
      if (coords) {
        searchParams.latitude = coords.lat;
        searchParams.longitude = coords.lon;
        searchParams.radius = params.radius || 15000; // 15км для міста
      } else {
        throw new Error(`Не вдалося знайти координати для міста "${params.city}"`);
      }
    }

    const query = this.buildOverpassQuery(searchParams);

    try {
      const response = await axios.post(OVERPASS_API_URL, query, {
        headers: { 'Content-Type': 'text/plain' },
        timeout: 30000
      });

      return this.parseOverpassResponse(response.data);
    } catch (error) {
      console.error('Error fetching places from OSM:', error);
      throw new Error('Failed to fetch places from OpenStreetMap');
    }
  }

  /**
   * Отримання деталей про конкретне місце
   */
  async getPlaceDetails(placeId: string): Promise<Place | null> {
    const query = `
      [out:json][timeout:25];
      (
        node(${placeId});
        way(${placeId});
        relation(${placeId});
      );
      out body;
      >;
      out skel qt;
    `;

    try {
      const response = await axios.post(OVERPASS_API_URL, query, {
        headers: { 'Content-Type': 'text/plain' }
      });

      const places = this.parseOverpassResponse(response.data);
      return places.length > 0 ? places[0] : null;
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  }

  /**
   * Побудова Overpass QL запиту
   */
  private buildOverpassQuery(params: SearchParams): string {
    const { latitude, longitude, radius = 15000, types, limit = 100 } = params;

    // Для пошуку ЗАВЖДИ потрібні координати
    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required for search');
    }

    // Визначаємо область пошуку - завжди по координатах
    const areaFilter = `(around:${radius},${latitude},${longitude})`;

    // Категорії місць для пошуку
    const categories = this.getOSMCategories(types);

    // Формуємо запит - ПРОСТІШИЙ, щоб не блокувався
    const queries = categories.map(cat => `
      node["${cat.key}"="${cat.value}"]${areaFilter};
      way["${cat.key}"="${cat.value}"]${areaFilter};
      relation["${cat.key}"="${cat.value}"]${areaFilter};
    `).join('');

    return `
      [out:json][timeout:25];
      (
        ${queries}
      );
      out center;
      out body;
      ${limit};
    `;
  }

  /**
   * Отримання OSM категорій на основі типів місць
   */
  private getOSMCategories(types?: PlaceType[]): Array<{ key: string; value: string }> {
    const allCategories = [
      // Історичні місця
      { key: 'historic', value: 'castle' },
      { key: 'historic', value: 'monument' },
      { key: 'historic', value: 'memorial' },
      { key: 'historic', value: 'archaeological_site' },
      { key: 'historic', value: 'ruins' },
      { key: 'historic', value: 'fort' },

      // Музеї та культура
      { key: 'tourism', value: 'museum' },
      { key: 'tourism', value: 'gallery' },
      { key: 'amenity', value: 'theatre' },

      // Релігійні споруди
      { key: 'amenity', value: 'place_of_worship' },
      { key: 'building', value: 'church' },
      { key: 'building', value: 'cathedral' },
      { key: 'building', value: 'monastery' },

      // Природа та парки
      { key: 'leisure', value: 'park' },
      { key: 'leisure', value: 'nature_reserve' },
      { key: 'boundary', value: 'national_park' },
      { key: 'natural', value: 'peak' },
      { key: 'natural', value: 'waterfall' },
      { key: 'natural', value: 'cave_entrance' },

      // Оглядові майданчики
      { key: 'tourism', value: 'viewpoint' },

      // Туристичні атракції
      { key: 'tourism', value: 'attraction' },
      { key: 'tourism', value: 'artwork' },
    ];

    // Якщо типи не вказані, повертаємо всі категорії
    if (!types || types.length === 0) {
      return allCategories;
    }

    // Фільтруємо за типами
    const filteredCategories: Array<{ key: string; value: string }> = [];

    types.forEach(type => {
      switch (type) {
        case PlaceType.CASTLE:
          filteredCategories.push({ key: 'historic', value: 'castle' });
          break;
        case PlaceType.MONUMENT:
          filteredCategories.push({ key: 'historic', value: 'monument' });
          filteredCategories.push({ key: 'historic', value: 'memorial' });
          break;
        case PlaceType.MUSEUM:
          filteredCategories.push({ key: 'tourism', value: 'museum' });
          filteredCategories.push({ key: 'tourism', value: 'gallery' });
          break;
        case PlaceType.PARK:
        case PlaceType.NATURE:
          filteredCategories.push({ key: 'leisure', value: 'park' });
          filteredCategories.push({ key: 'leisure', value: 'nature_reserve' });
          filteredCategories.push({ key: 'boundary', value: 'national_park' });
          filteredCategories.push({ key: 'natural', value: 'peak' });
          filteredCategories.push({ key: 'natural', value: 'waterfall' });
          break;
        case PlaceType.RELIGIOUS:
          filteredCategories.push({ key: 'amenity', value: 'place_of_worship' });
          filteredCategories.push({ key: 'building', value: 'church' });
          filteredCategories.push({ key: 'building', value: 'cathedral' });
          break;
        case PlaceType.VIEWPOINT:
          filteredCategories.push({ key: 'tourism', value: 'viewpoint' });
          break;
        default:
          filteredCategories.push({ key: 'tourism', value: 'attraction' });
      }
    });

    return filteredCategories;
  }

  /**
   * Парсинг відповіді від Overpass API
   */
  private parseOverpassResponse(data: any): Place[] {
    if (!data.elements || !Array.isArray(data.elements)) {
      return [];
    }

    const places: Place[] = [];
    const seenIds = new Set<string>();

    for (const element of data.elements) {
      // Пропускаємо дублікати
      if (seenIds.has(element.id.toString())) {
        continue;
      }

      // Отримуємо координати
      let lat = element.lat;
      let lon = element.lon;

      // Для way та relation використовуємо центр
      if (!lat || !lon) {
        if (element.center) {
          lat = element.center.lat;
          lon = element.center.lon;
        } else {
          continue; // Пропускаємо елементи без координат
        }
      }

      const tags = element.tags || {};

      // Отримуємо назву (українською, якщо є)
      const name = tags['name:uk'] || tags.name || 'Без назви';

      // Визначаємо тип місця
      const placeType = this.determinePlaceType(tags);

      const place: Place = {
        id: `${element.type}/${element.id}`,
        name,
        type: placeType,
        category: this.getCategoryName(placeType),
        latitude: lat,
        longitude: lon,
        description: tags.description || tags['description:uk'] || undefined,
        tags,
        address: this.buildAddress(tags),
        website: tags.website || tags['contact:website'] || undefined,
      };

      places.push(place);
      seenIds.add(element.id.toString());
    }

    return places;
  }

  /**
   * Визначення типу місця на основі тегів OSM
   */
  private determinePlaceType(tags: Record<string, string>): PlaceType {
    if (tags.historic === 'castle') return PlaceType.CASTLE;
    if (tags.historic === 'monument' || tags.historic === 'memorial') return PlaceType.MONUMENT;
    if (tags.historic) return PlaceType.HISTORICAL;
    if (tags.tourism === 'museum' || tags.tourism === 'gallery') return PlaceType.MUSEUM;
    if (tags.leisure === 'park' || tags.leisure === 'nature_reserve') return PlaceType.PARK;
    if (tags.boundary === 'national_park' || tags.natural) return PlaceType.NATURE;
    if (tags.amenity === 'place_of_worship' || tags.building === 'church' || tags.building === 'cathedral') return PlaceType.RELIGIOUS;
    if (tags.tourism === 'viewpoint') return PlaceType.VIEWPOINT;
    if (tags.building === 'historic' || tags.architectural_style) return PlaceType.ARCHITECTURE;
    if (tags.tourism === 'attraction') return PlaceType.CULTURAL;
    return PlaceType.OTHER;
  }

  /**
   * Отримання назви категорії українською
   */
  private getCategoryName(type: PlaceType): string {
    const names: Record<PlaceType, string> = {
      [PlaceType.HISTORICAL]: 'Історична пам\'ятка',
      [PlaceType.MUSEUM]: 'Музей',
      [PlaceType.PARK]: 'Парк',
      [PlaceType.NATURE]: 'Природа',
      [PlaceType.RELIGIOUS]: 'Релігійна споруда',
      [PlaceType.ARCHITECTURE]: 'Архітектура',
      [PlaceType.MONUMENT]: 'Монумент',
      [PlaceType.CASTLE]: 'Замок',
      [PlaceType.VIEWPOINT]: 'Оглядовий майданчик',
      [PlaceType.CULTURAL]: 'Культурне місце',
      [PlaceType.OTHER]: 'Інше',
    };
    return names[type] || 'Інше';
  }

  /**
   * Формування адреси з тегів
   */
  private buildAddress(tags: Record<string, string>): string | undefined {
    const parts: string[] = [];

    if (tags['addr:street']) parts.push(tags['addr:street']);
    if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
    if (tags['addr:city']) parts.push(tags['addr:city']);

    return parts.length > 0 ? parts.join(', ') : undefined;
  }
}

export default new OSMService();
