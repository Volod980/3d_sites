import React, { useState, useEffect } from 'react';
import tourApi from '../services/api';
import { Place } from '../types';

interface AIAssistantProps {
  city: string;
  onPlacesRecommended?: (placeNames: string[]) => void;
  availablePlaces?: Place[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ city, onPlacesRecommended, availablePlaces }) => {
  const [isAIAvailable, setIsAIAvailable] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    const status = await tourApi.checkAIStatus();
    setIsAIAvailable(status.available);

    if (!status.available && status.message) {
      console.log('AI недоступний:', status.message);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Створюємо контекст з доступними місцями
      const context = availablePlaces
        ? `Доступні місця в ${city}: ${availablePlaces.map(p => p.name).join(', ')}`
        : `Місто: ${city}`;

      const response = await tourApi.chatWithAI(userMessage, context);

      if (response) {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Вибачте, не вдалося отримати відповідь. Спробуйте ще раз.'
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Виникла помилка при спілкуванні з AI.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!inputMessage.trim() || isLoading || !city) return;

    const userRequest = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: `Порекомендуй місця: ${userRequest}` }]);
    setIsLoading(true);

    try {
      const result = await tourApi.getAIRecommendations(userRequest, city);

      if (result) {
        const responseText = `${result.explanation}\n\nРекомендовані місця:\n${result.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
        setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);

        // Повідомляємо батьківський компонент про рекомендації
        if (onPlacesRecommended) {
          onPlacesRecommended(result.recommendations);
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Вибачте, не вдалося отримати рекомендації. Спробуйте ще раз.'
        }]);
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Виникла помилка при отриманні рекомендацій.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isAIAvailable) {
    return (
      <div className="ai-assistant-unavailable">
        <p>🤖 AI асистент недоступний</p>
        <small>Додайте GEMINI_API_KEY в .env файл backend</small>
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '12px', color: '#3b82f6', marginTop: '5px', display: 'block' }}
        >
          Отримати безкоштовний ключ →
        </a>
      </div>
    );
  }

  return (
    <div className="ai-assistant">
      <button
        className="ai-toggle-button"
        onClick={() => setShowChat(!showChat)}
      >
        🤖 AI Асистент {showChat ? '▼' : '▶'}
      </button>

      {showChat && (
        <div className="ai-chat-container">
          <div className="ai-messages">
            {messages.length === 0 && (
              <div className="ai-welcome">
                <p>👋 Привіт! Я AI асистент туриста.</p>
                <p>Я можу:</p>
                <ul>
                  <li>Порекомендувати місця за вашим запитом</li>
                  <li>Відповісти на питання про визначні місця</li>
                  <li>Допомогти спланувати маршрут</li>
                </ul>
                <p><small>Наприклад: "романтична прогулянка" або "історія Києва"</small></p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div key={index} className={`ai-message ai-message-${msg.role}`}>
                <div className="ai-message-content">
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="ai-message ai-message-assistant">
                <div className="ai-message-content">
                  <p>⏳ Думаю...</p>
                </div>
              </div>
            )}
          </div>

          <div className="ai-input-container">
            <textarea
              className="ai-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Напишіть запит або питання..."
              rows={2}
              disabled={isLoading}
            />
            <div className="ai-buttons">
              <button
                className="ai-send-button"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
              >
                💬 Спитати
              </button>
              <button
                className="ai-recommend-button"
                onClick={handleGetRecommendations}
                disabled={!inputMessage.trim() || isLoading || !city}
              >
                ✨ Рекомендації
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
