'use client';
import { useState, useEffect } from 'react';

export const useMemoryGame = (currentUser) => {
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gameStats, setGameStats] = useState(null);

  // بارگذاری کارت‌های بازی
  const loadGame = async (level = 'easy') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/memory-cards?level=${level}`);
      
      if (response.ok) {
        const data = await response.json();
        setCards(data.cards);
        resetGame();
      }
    } catch (error) {
      console.error('خطا در بارگذاری بازی:', error);
    } finally {
      setLoading(false);
    }
  };

  // ریست بازی
  const resetGame = () => {
    setFlippedCards([]);
    setMatchedCards([]);
    setMoves(0);
    setScore(1000); // امتیاز پایه
    setGameCompleted(false);
  };

  // کلیک روی کارت
  const handleCardClick = (cardId) => {
    if (flippedCards.length >= 2 || flippedCards.includes(cardId) || matchedCards.includes(cardId)) {
      return;
    }

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      const [firstCardId, secondCardId] = newFlippedCards;
      const firstCard = cards.find(c => c.id === firstCardId);
      const secondCard = cards.find(c => c.id === secondCardId);

      // بررسی تطابق
      if (firstCard.pairId === secondCardId) {
        // کارت‌ها جفت هستند
        setMatchedCards([...matchedCards, firstCardId, secondCardId]);
        setFlippedCards([]);
      } else {
        // کارت‌ها جفت نیستند
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }

      // محاسبه امتیاز جدید
      const newScore = Math.max(0, 1000 - (moves + 1) * 20);
      setScore(newScore);
    }
  };

  // بررسی پایان بازی
  useEffect(() => {
    if (cards.length > 0 && matchedCards.length === cards.length) {
      setGameCompleted(true);
      saveGameResult();
    }
  }, [matchedCards, cards.length]);

  // ذخیره نتیجه بازی
  const saveGameResult = async () => {
    if (!currentUser) return;

    try {
      await fetch('/api/memory-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          level: 'easy',
          moves: moves + 1,
          score: score,
          timeSpent: 0 // می‌تونیم بعداً اضافه کنیم
        }),
      });
    } catch (error) {
      console.error('خطا در ذخیره نتیجه:', error);
    }
  };

  return {
    cards,
    flippedCards,
    matchedCards,
    moves,
    score,
    gameCompleted,
    loading,
    gameStats,
    loadGame,
    handleCardClick,
    resetGame
  };
};