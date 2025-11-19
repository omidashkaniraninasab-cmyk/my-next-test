'use client';
import { useState, useEffect } from 'react';

export const useDailyChallenge = (currentUser) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [userAnswer, setUserAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [challengeStats, setChallengeStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDailyQuestion();
    if (currentUser) {
      loadChallengeStats();
    }
  }, [currentUser]);

  useEffect(() => {
    let timer;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimeUp();
    }
    
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  const loadDailyQuestion = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/daily-challenge');
      
      if (response.ok) {
        const data = await response.json();
        setCurrentQuestion(data.question);
        setIsActive(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'خطا در دریافت سوال');
      }
    } catch (error) {
      console.error('خطا در بارگذاری سوال چالش:', error);
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const loadChallengeStats = async () => {
    try {
      const response = await fetch(`/api/daily-challenge/stats?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setChallengeStats(data.stats);
      }
    } catch (error) {
      console.error('خطا در بارگذاری آمار چالش:', error);
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim() || hasAnswered || !currentQuestion || !currentUser) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/daily-challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          answer: userAnswer,
          questionId: currentQuestion.id
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        setUserScore(result.score);
        setHasAnswered(true);
        setIsActive(false);
        setChallengeCompleted(true);
        
        // آپدیت آمار چالش
        await loadChallengeStats();
        
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'خطا در ثبت پاسخ چالش');
      }
    } catch (error) {
      console.error('خطا در ارسال پاسخ چالش:', error);
      setError('خطا در ارتباط با سرور چالش');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUp = () => {
    setIsActive(false);
    if (!hasAnswered) {
      setChallengeCompleted(true);
    }
  };

  const resetChallenge = () => {
    setUserAnswer('');
    setHasAnswered(false);
    setUserScore(0);
    setChallengeCompleted(false);
    setTimeLeft(10);
    setIsActive(true);
    setError(null);
  };

  return {
    currentQuestion,
    timeLeft,
    userAnswer,
    setUserAnswer,
    hasAnswered,
    userScore,
    isActive,
    challengeCompleted,
    loading,
    challengeStats,
    error,
    submitAnswer,
    resetChallenge,
    loadChallengeStats
  };
};