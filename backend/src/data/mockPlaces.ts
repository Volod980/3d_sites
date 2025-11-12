import { Place, PlaceType } from '../types';

/**
 * Тестові дані для демонстрації (Київ)
 * Використовується коли OpenStreetMap API недоступний
 */
export const MOCK_KYIV_PLACES: Place[] = [
  {
    id: 'mock-1',
    name: 'Софійський собор',
    type: PlaceType.RELIGIOUS,
    category: 'Релігійна споруда',
    latitude: 50.4527,
    longitude: 30.5146,
    description: 'Пам\'ятка архітектури XI століття, один з найвідоміших храмів Києва',
    tags: { historic: 'monument', tourism: 'attraction' },
    address: 'Володимирська вул., 24'
  },
  {
    id: 'mock-2',
    name: 'Києво-Печерська лавра',
    type: PlaceType.RELIGIOUS,
    category: 'Релігійна споруда',
    latitude: 50.4345,
    longitude: 30.5579,
    description: 'Один з найважливіших православних монастирів, заснований у 1051 році',
    tags: { historic: 'monastery', tourism: 'attraction' },
    address: 'вул. Лаврська, 15'
  },
  {
    id: 'mock-3',
    name: 'Майдан Незалежності',
    type: PlaceType.MONUMENT,
    category: 'Монумент',
    latitude: 50.4501,
    longitude: 30.5234,
    description: 'Центральна площа Києва, місце історичних подій',
    tags: { tourism: 'attraction' },
    address: 'Майдан Незалежності'
  },
  {
    id: 'mock-4',
    name: 'Андріївський узвіз',
    type: PlaceType.CULTURAL,
    category: 'Культурне місце',
    latitude: 50.4577,
    longitude: 30.5169,
    description: 'Історична вулиця з Андріївською церквою, галереями та сувенірними крамницями',
    tags: { tourism: 'attraction' },
    address: 'Андріївський узвіз'
  },
  {
    id: 'mock-5',
    name: 'Золоті ворота',
    type: PlaceType.HISTORICAL,
    category: 'Історична пам\'ятка',
    latitude: 50.4486,
    longitude: 30.5130,
    description: 'Пам\'ятка оборонної архітектури Київської Русі XI століття',
    tags: { historic: 'monument' },
    address: 'вул. Володимирська, 40А'
  },
  {
    id: 'mock-6',
    name: 'Хрещатик',
    type: PlaceType.CULTURAL,
    category: 'Культурне місце',
    latitude: 50.4474,
    longitude: 30.5253,
    description: 'Головна вулиця Києва з магазинами, ресторанами та історичними будівлями',
    tags: { tourism: 'attraction' },
    address: 'вул. Хрещатик'
  },
  {
    id: 'mock-7',
    name: 'Михайлівський Золотоверхий монастир',
    type: PlaceType.RELIGIOUS,
    category: 'Релігійна споруда',
    latitude: 50.4556,
    longitude: 30.5265,
    description: 'Монастир з блакитними стінами та золотими банями',
    tags: { building: 'cathedral', tourism: 'attraction' },
    address: 'Трьохсвятительська вул., 8'
  },
  {
    id: 'mock-8',
    name: 'Національний музей історії України',
    type: PlaceType.MUSEUM,
    category: 'Музей',
    latitude: 50.4489,
    longitude: 30.5234,
    description: 'Найбільший історичний музей України з колекцією понад 800 000 експонатів',
    tags: { tourism: 'museum' },
    address: 'вул. Володимирська, 2'
  },
  {
    id: 'mock-9',
    name: 'Парк Шевченка',
    type: PlaceType.PARK,
    category: 'Парк',
    latitude: 50.4485,
    longitude: 30.4596,
    description: 'Один з найстаріших парків Києва, заснований у 1841 році',
    tags: { leisure: 'park' },
    address: 'вул. Володимирська'
  },
  {
    id: 'mock-10',
    name: 'Національний музей "Меморіал жертв Голодомору"',
    type: PlaceType.MUSEUM,
    category: 'Музей',
    latitude: 50.4274,
    longitude: 30.5619,
    description: 'Меморіал пам\'яті жертв Голодомору 1932-1933 років',
    tags: { tourism: 'museum', historic: 'memorial' },
    address: 'Лаврська вул., 3'
  },
  {
    id: 'mock-11',
    name: 'Оперний театр',
    type: PlaceType.CULTURAL,
    category: 'Культурне місце',
    latitude: 50.4487,
    longitude: 30.5164,
    description: 'Національна опера України імені Тараса Шевченка',
    tags: { amenity: 'theatre', tourism: 'attraction' },
    address: 'вул. Володимирська, 50'
  },
  {
    id: 'mock-12',
    name: 'Родина-Мати',
    type: PlaceType.MONUMENT,
    category: 'Монумент',
    latitude: 50.4265,
    longitude: 30.5631,
    description: 'Монументальна скульптура на честь перемоги у Другій світовій війні, висота 102 метри',
    tags: { historic: 'monument', tourism: 'attraction' },
    address: 'Музей Великої Вітчизняної війни'
  },
  {
    id: 'mock-13',
    name: 'Маріїнський палац',
    type: PlaceType.ARCHITECTURE,
    category: 'Архітектура',
    latitude: 50.4489,
    longitude: 30.5373,
    description: 'Церемонійна резиденція Президента України, бароковий палац XVIII століття',
    tags: { tourism: 'attraction', building: 'historic' },
    address: 'вул. Грушевського, 5А'
  },
  {
    id: 'mock-14',
    name: 'Ботанічний сад ім. Гришка',
    type: PlaceType.PARK,
    category: 'Парк',
    latitude: 50.4186,
    longitude: 30.5595,
    description: 'Один з найкращих ботанічних садів Європи, заснований у 1839 році',
    tags: { leisure: 'nature_reserve', tourism: 'attraction' },
    address: 'вул. Тімірязєвська, 1'
  },
  {
    id: 'mock-15',
    name: 'Пейзажна алея',
    type: PlaceType.CULTURAL,
    category: 'Культурне місце',
    latitude: 50.4618,
    longitude: 30.5147,
    description: 'Пішохідна вулиця з мозаїчними скульптурами та арт-об\'єктами',
    tags: { tourism: 'attraction', tourism_artwork: 'yes' },
    address: 'Пейзажна алея'
  }
];

/**
 * Отримати mock дані для міста
 */
export function getMockPlacesForCity(cityName: string): Place[] {
  // Поки що тільки для Києва
  if (cityName.toLowerCase().includes('київ') || cityName.toLowerCase().includes('kyiv')) {
    return MOCK_KYIV_PLACES;
  }

  return [];
}
