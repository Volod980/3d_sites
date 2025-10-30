import { Place, Route, RouteSegment, RouteRequest } from '../types';
import { calculateDistance } from '../utils/geoUtils';

/**
 * Сервіс для побудови оптимальних туристичних маршрутів
 * Використовує алгоритм Nearest Neighbor + 2-opt для оптимізації
 */
export class RouteService {
  /**
   * Побудова оптимального маршруту для відвідування місць
   */
  buildOptimalRoute(places: Place[], startPoint?: { latitude: number; longitude: number }): Route {
    if (places.length === 0) {
      return {
        places: [],
        totalDistance: 0,
        optimizedOrder: [],
        segments: []
      };
    }

    if (places.length === 1) {
      return {
        places,
        totalDistance: 0,
        optimizedOrder: [0],
        segments: []
      };
    }

    // Знаходимо оптимальний порядок відвідування
    const optimizedOrder = this.findOptimalOrder(places, startPoint);

    // Створюємо маршрут в оптимальному порядку
    const orderedPlaces = optimizedOrder.map(index => places[index]);

    // Обчислюємо сегменти та загальну відстань
    const segments: RouteSegment[] = [];
    let totalDistance = 0;

    for (let i = 0; i < orderedPlaces.length - 1; i++) {
      const from = orderedPlaces[i];
      const to = orderedPlaces[i + 1];
      const distance = calculateDistance(
        from.latitude,
        from.longitude,
        to.latitude,
        to.longitude
      );

      segments.push({ from, to, distance });
      totalDistance += distance;
    }

    return {
      places: orderedPlaces,
      totalDistance,
      optimizedOrder,
      segments
    };
  }

  /**
   * Знаходження оптимального порядку відвідування місць
   * Використовується алгоритм Nearest Neighbor з покращенням 2-opt
   */
  private findOptimalOrder(places: Place[], startPoint?: { latitude: number; longitude: number }): number[] {
    const n = places.length;

    // Nearest Neighbor алгоритм
    let tour = this.nearestNeighbor(places, startPoint);

    // Покращення за допомогою 2-opt
    tour = this.twoOpt(places, tour);

    return tour;
  }

  /**
   * Nearest Neighbor алгоритм
   * Починаємо з найближчої точки до стартової позиції (або першої точки)
   * та йдемо до найближчої невідвіданої точки
   */
  private nearestNeighbor(places: Place[], startPoint?: { latitude: number; longitude: number }): number[] {
    const n = places.length;
    const visited = new Array(n).fill(false);
    const tour: number[] = [];

    // Знаходимо стартову точку
    let current = 0;
    if (startPoint) {
      let minDist = Infinity;
      for (let i = 0; i < n; i++) {
        const dist = calculateDistance(
          startPoint.latitude,
          startPoint.longitude,
          places[i].latitude,
          places[i].longitude
        );
        if (dist < minDist) {
          minDist = dist;
          current = i;
        }
      }
    }

    // Додаємо стартову точку
    visited[current] = true;
    tour.push(current);

    // Додаємо інші точки в порядку найближчого сусіда
    for (let i = 1; i < n; i++) {
      let nearestIndex = -1;
      let minDistance = Infinity;

      for (let j = 0; j < n; j++) {
        if (!visited[j]) {
          const distance = calculateDistance(
            places[current].latitude,
            places[current].longitude,
            places[j].latitude,
            places[j].longitude
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearestIndex = j;
          }
        }
      }

      current = nearestIndex;
      visited[current] = true;
      tour.push(current);
    }

    return tour;
  }

  /**
   * 2-opt алгоритм покращення маршруту
   * Перевіряємо всі можливі комбінації та міняємо ребра, якщо це покращує маршрут
   */
  private twoOpt(places: Place[], tour: number[]): number[] {
    const n = tour.length;
    let improved = true;
    let bestTour = [...tour];

    while (improved) {
      improved = false;

      for (let i = 0; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
          // Обчислюємо поточну довжину
          const currentDist = this.getTourDistance(places, bestTour);

          // Створюємо новий маршрут з обернутим сегментом
          const newTour = this.reverseTourSegment(bestTour, i, j);
          const newDist = this.getTourDistance(places, newTour);

          // Якщо новий маршрут коротший, використовуємо його
          if (newDist < currentDist) {
            bestTour = newTour;
            improved = true;
          }
        }
      }
    }

    return bestTour;
  }

  /**
   * Обернення сегменту маршруту
   */
  private reverseTourSegment(tour: number[], i: number, j: number): number[] {
    const newTour = [...tour];
    const segment = newTour.slice(i, j + 1).reverse();
    newTour.splice(i, j - i + 1, ...segment);
    return newTour;
  }

  /**
   * Обчислення загальної довжини маршруту
   */
  private getTourDistance(places: Place[], tour: number[]): number {
    let totalDistance = 0;

    for (let i = 0; i < tour.length - 1; i++) {
      const from = places[tour[i]];
      const to = places[tour[i + 1]];
      totalDistance += calculateDistance(
        from.latitude,
        from.longitude,
        to.latitude,
        to.longitude
      );
    }

    return totalDistance;
  }

  /**
   * Обчислення матриці відстаней між усіма точками
   */
  calculateDistanceMatrix(places: Place[]): number[][] {
    const n = places.length;
    const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          matrix[i][j] = calculateDistance(
            places[i].latitude,
            places[i].longitude,
            places[j].latitude,
            places[j].longitude
          );
        }
      }
    }

    return matrix;
  }
}

export default new RouteService();
