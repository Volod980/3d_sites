import axios from 'axios';
import { Place, PlaceType, SearchParams } from '../types';

/**
 * Сервіс для роботи з Google Maps Places API (New)
 * Документація: https://developers.google.com/maps/documentation/places/web-service/overview
 */
export class GoogleMapsService {
  private apiKey: string | undefined;
  private baseUrl = 'https://places.googleapis.com/v1/places';

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!this.apiKey) {
      console.warn('⚠️  GOOGLE_MAPS_API_KEY не знайдено. Google Maps функції недоступні.');
      console.warn('📖 Інструкція: /GOOGLE_MAPS_API_SETUP.md');
    } else {
      console.log('✅ Google Maps API ініціалізовано');
    }
  }

  /**
   * Перевірка чи Google Maps API доступний
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Пошук місць за параметрами
   */
  async searchPlaces(params: SearchParams): Promise<Place[]> {
    if (!this.isAvailable()) {
      throw new Error('Google Maps API недоступний. Додайте GOOGLE_MAPS_API_KEY в .env');
    }

    try {
      let places: Place[] = [];

      // Якщо вказано місто - спочатку отримуємо його координати
      if (params.city) {
        const cityCoords = await this.getCityCoordinates(params.city);
        if (!cityCoords) {
          console.log(`Не вдалося знайти координати для міста: ${params.city}`);
          return [];
        }
        params.latitude = cityCoords.lat;
        params.longitude = cityCoords.lng;
      }

      // Якщо немає координат - не можемо шукати
      if (!params.latitude || !params.longitude) {
        throw new Error('Необхідно вказати місто або координати');
      }

      // Шукаємо туристичні місця
      places = await this.searchNearbyPlaces(
        params.latitude,
        params.longitude,
        params.radius || 15000, // 15км за замовчуванням
        params.limit || 50
      );

      // Фільтруємо за рейтингом якщо вказано
      if (params.minRating) {
        places = places.filter(p => p.rating && p.rating >= params.minRating!);
      }

      // Фільтруємо за кількістю відгуків якщо вказано
      if (params.minReviews) {
        places = places.filter(p => p.userRatingsTotal && p.userRatingsTotal >= params.minReviews!);
      }

      // Сортуємо за популярністю (рейтинг × кількість відгуків)
      places.sort((a, b) => {
        const scoreA = (a.rating || 0) * (a.userRatingsTotal || 0);
        const scoreB = (b.rating || 0) * (b.userRatingsTotal || 0);
        return scoreB - scoreA;
      });

      // Обмежуємо кількість результатів
      if (params.limit) {
        places = places.slice(0, params.limit);
      }

      console.log(`✅ Знайдено ${places.length} місць через Google Maps`);
      return places;

    } catch (error) {
      console.error('Помилка пошуку місць в Google Maps:', error);
      throw error;
    }
  }

  /**
   * Отримання координат міста за назвою (геокодинг)
   */
  private async getCityCoordinates(cityName: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await axios.post(
        `${this.baseUrl}:searchText`,
        {
          textQuery: `${cityName}, Ukraine`,
          languageCode: 'uk'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey!,
            'X-Goog-FieldMask': 'places.location'
          }
        }
      );

      if (response.data.places && response.data.places.length > 0) {
        const location = response.data.places[0].location;
        return {
          lat: location.latitude,
          lng: location.longitude
        };
      }

      return null;
    } catch (error) {
      console.error('Помилка геокодингу:', error);
      return null;
    }
  }

  /**
   * Пошук туристичних місць поблизу координат
   */
  private async searchNearbyPlaces(
    lat: number,
    lng: number,
    radius: number,
    limit: number
  ): Promise<Place[]> {
    const places: Place[] = [];

    try {
      // Категорії туристичних місць для пошуку
      const includedTypes = [
        'tourist_attraction',
        'museum',
        'art_gallery',
        'church',
        'hindu_temple',
        'mosque',
        'synagogue',
        'park',
        'amusement_park',
        'aquarium',
        'zoo',
        'historical_landmark',
        'monument',
        'castle',
        'cultural_center'
      ];

      const response = await axios.post(
        `${this.baseUrl}:searchNearby`,
        {
          includedTypes: includedTypes,
          maxResultCount: Math.min(limit, 20), // API дозволяє максимум 20
          locationRestriction: {
            circle: {
              center: {
                latitude: lat,
                longitude: lng
              },
              radius: radius
            }
          },
          languageCode: 'uk'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey!,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.websiteUri,places.editorialSummary,places.photos,places.priceLevel,places.nationalPhoneNumber,places.currentOpeningHours'
          }
        }
      );

      if (response.data.places) {
        for (const googlePlace of response.data.places) {
          const place = this.convertGooglePlaceToPlace(googlePlace);
          if (place) {
            places.push(place);
          }
        }
      }

      return places;

    } catch (error: any) {
      console.error('Помилка пошуку nearby places:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Конвертація Google Place в наш формат Place
   */
  private convertGooglePlaceToPlace(googlePlace: any): Place | null {
    try {
      const id = googlePlace.id || googlePlace.name;
      const name = googlePlace.displayName?.text || 'Без назви';
      const latitude = googlePlace.location?.latitude;
      const longitude = googlePlace.location?.longitude;

      if (!latitude || !longitude) {
        return null;
      }

      // Визначаємо категорію на основі типів
      const type = this.determinePlaceType(googlePlace.types || []);
      const category = this.getCategoryName(type);

      const place: Place = {
        id,
        name,
        type,
        category,
        latitude,
        longitude,
        rating: googlePlace.rating,
        userRatingsTotal: googlePlace.userRatingCount,
        address: googlePlace.formattedAddress,
        description: googlePlace.editorialSummary?.text,
        website: googlePlace.websiteUri,
        priceLevel: googlePlace.priceLevel,
        phoneNumber: googlePlace.nationalPhoneNumber
      };

      // Додаємо URL фото якщо є
      if (googlePlace.photos && googlePlace.photos.length > 0) {
        const photoName = googlePlace.photos[0].name;
        // Фото потребує окремого запиту, поки просто зберігаємо ім'я
        place.imageUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${this.apiKey}&maxHeightPx=400`;
      }

      // Додаємо години роботи якщо є
      if (googlePlace.currentOpeningHours?.weekdayDescriptions) {
        place.openingHours = googlePlace.currentOpeningHours.weekdayDescriptions;
      }

      return place;

    } catch (error) {
      console.error('Помилка конвертації Google Place:', error);
      return null;
    }
  }

  /**
   * Визначення типу місця на основі Google types
   */
  private determinePlaceType(types: string[]): PlaceType {
    if (types.includes('museum') || types.includes('art_gallery')) {
      return PlaceType.MUSEUM;
    }
    if (types.includes('park') || types.includes('amusement_park')) {
      return PlaceType.PARK;
    }
    if (types.includes('church') || types.includes('hindu_temple') ||
        types.includes('mosque') || types.includes('synagogue')) {
      return PlaceType.RELIGIOUS;
    }
    if (types.includes('historical_landmark') || types.includes('monument')) {
      return PlaceType.MONUMENT;
    }
    if (types.includes('castle')) {
      return PlaceType.CASTLE;
    }
    if (types.includes('tourist_attraction')) {
      return PlaceType.HISTORICAL;
    }
    if (types.includes('cultural_center')) {
      return PlaceType.CULTURAL;
    }
    return PlaceType.OTHER;
  }

  /**
   * Отримання назви категорії українською
   */
  private getCategoryName(type: PlaceType): string {
    const categories: Record<PlaceType, string> = {
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
      [PlaceType.OTHER]: 'Інше'
    };
    return categories[type] || 'Туристичне місце';
  }

  /**
   * Отримання деталей конкретного місця
   */
  async getPlaceDetails(placeId: string): Promise<Place | null> {
    if (!this.isAvailable()) {
      throw new Error('Google Maps API недоступний');
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/${placeId}`,
        {
          headers: {
            'X-Goog-Api-Key': this.apiKey!,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount,types,websiteUri,editorialSummary,photos,priceLevel,nationalPhoneNumber,currentOpeningHours'
          }
        }
      );

      return this.convertGooglePlaceToPlace(response.data);

    } catch (error) {
      console.error('Помилка отримання деталей місця:', error);
      return null;
    }
  }
}

export default new GoogleMapsService();
