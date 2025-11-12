import { GoogleGenerativeAI } from '@google/generative-ai';
import { Place } from '../types';

/**
 * AI сервіс для рекомендацій та допомоги туристам
 * Використовує Google Gemini AI
 */
export class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private initialized: boolean = false;

  /**
   * Ініціалізація AI сервісу (lazy initialization)
   */
  private initialize(): void {
    if (this.initialized) return;

    this.initialized = true;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      console.log('✅ AI сервіс ініціалізовано успішно');
    } else {
      console.warn('⚠️  GEMINI_API_KEY не знайдено. AI функції недоступні.');
    }
  }

  /**
   * Перевірка чи AI доступний
   */
  isAvailable(): boolean {
    this.initialize();
    return this.model !== null;
  }

  /**
   * Отримати рекомендації місць на основі запиту користувача
   */
  async getPlaceRecommendations(
    userRequest: string,
    availablePlaces: Place[]
  ): Promise<{
    recommendations: string[];
    explanation: string;
  }> {
    if (!this.isAvailable()) {
      throw new Error('AI сервіс недоступний. Додайте GEMINI_API_KEY в .env файл');
    }

    const placesInfo = availablePlaces.map((p, i) =>
      `${i + 1}. ${p.name} - ${p.category} (${p.description || 'без опису'})`
    ).join('\n');

    const prompt = `
Ти - досвідчений туристичний гід по Україні. Користувач шукає місця для відвідування.

Запит користувача: "${userRequest}"

Доступні місця:
${placesInfo}

Завдання:
1. Проаналізуй запит користувача
2. Вибери найбільш підходящі місця (від 3 до 7)
3. Поясни чому ці місця підходять

Відповідь у форматі JSON:
{
  "recommendations": ["Назва місця 1", "Назва місця 2", ...],
  "explanation": "Коротке пояснення чому ці місця підходять (2-3 речення)"
}

Відповідай ТІЛЬКИ JSON, без додаткового тексту.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Парсимо JSON відповідь
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }

      // Fallback якщо не JSON
      return {
        recommendations: [],
        explanation: text
      };
    } catch (error) {
      console.error('AI recommendation error:', error);
      throw new Error('Помилка при отриманні рекомендацій від AI');
    }
  }

  /**
   * Генерація опису туристичного маршруту
   */
  async generateRouteDescription(places: Place[], totalDistance: number): Promise<string> {
    if (!this.isAvailable()) {
      return 'AI опис недоступний';
    }

    const placesList = places.map((p, i) =>
      `${i + 1}. ${p.name} - ${p.category}`
    ).join('\n');

    const prompt = `
Створи привабливий опис туристичного маршруту по Україні.

Місця в маршруті:
${placesList}

Загальна відстань: ${(totalDistance / 1000).toFixed(1)} км

Створи короткий (3-4 речення) захоплюючий опис цього маршруту, підкресливши різноманітність місць та що цікавого може побачити турист.

Відповідай українською мовою.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('AI description error:', error);
      return 'Захоплюючий маршрут по найцікавішим місцям України!';
    }
  }

  /**
   * Відповіді на питання про місця
   */
  async answerQuestion(question: string, places: Place[]): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('AI сервіс недоступний');
    }

    const placesInfo = places.map(p =>
      `${p.name}: ${p.description || p.category}`
    ).join('\n');

    const prompt = `
Ти - експерт з туризму в Україні. Відповідай на питання про туристичні місця.

Доступна інформація про місця:
${placesInfo}

Питання користувача: "${question}"

Дай коротку (2-3 речення), але інформативну відповідь українською мовою.
Якщо не знаєш точної відповіді - скажи це чесно.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('AI answer error:', error);
      throw new Error('Помилка при отриманні відповіді від AI');
    }
  }

  /**
   * Чат з AI помічником
   */
  async chat(message: string, context?: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('AI сервіс недоступний. Додайте GEMINI_API_KEY в .env файл');
    }

    const systemPrompt = `
Ти - дружній AI помічник для туристичного сервісу по Україні.
Допомагай користувачам:
- Вибирати цікаві місця для відвідування
- Планувати маршрути
- Відповідати на питання про пам'ятки
- Давати корисні поради для туристів

Спілкуйся дружньо та професійно українською мовою.
Якщо не знаєш точної інформації - скажи це чесно.

${context ? `Контекст: ${context}` : ''}
`;

    const fullPrompt = `${systemPrompt}\n\nПовідомлення користувача: ${message}`;

    try {
      const result = await this.model.generateContent(fullPrompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('AI chat error:', error);
      throw new Error('Помилка при спілкуванні з AI');
    }
  }
}

export default new AIService();
