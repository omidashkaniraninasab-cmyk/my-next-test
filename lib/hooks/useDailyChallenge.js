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
      console.log('🔄 در حال دریافت سوال چالش...');
      
      const response = await fetch('/api/daily-challenge');
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ سوال دریافت شد:', data.question);
        setCurrentQuestion(data.question);
        setIsActive(true);
      } else {
        const errorData = await response.json();
        console.error('❌ خطا در دریافت سوال:', errorData);
        setError(errorData.error || 'خطا در دریافت سوال');
      }
    } catch (error) {
      console.error('❌ خطا در بارگذاری سوال چالش:', error);
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const loadChallengeStats = async () => {
    try {
      console.log('📊 در حال دریافت آمار چالش...');
      const response = await fetch(`/api/daily-challenge/stats?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ آمار دریافت شد:', data.stats);
        setChallengeStats(data.stats);
      } else {
        console.error('❌ خطا در دریافت آمار');
      }
    } catch (error) {
      console.error('❌ خطا در بارگذاری آمار چالش:', error);
    }
  };

  const submitAnswer = async (e) => {
  if (e) {
    e.preventDefault();
  }
  
  console.log('🎯 شروع ثبت پاسخ...', {
    userAnswer,
    hasAnswered,
    currentQuestion: !!currentQuestion,
    currentUser: !!currentUser,
    loading
  });

  if (!userAnswer.trim()) {
    console.log('❌ پاسخ خالی است');
    alert('لطفاً پاسخ را وارد کنید');
    return;
  }

  if (hasAnswered || !currentQuestion || !currentUser || loading) {
    console.log('❌ شرایط ثبت پاسخ برقرار نیست');
    return;
  }

  setLoading(true);
  setError(null);
  
  try {
    console.log('📤 ارسال پاسخ به سرور...', {
      userId: currentUser.id,
      answer: userAnswer,
      questionId: currentQuestion.id
    });

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

    console.log('📥 پاسخ سرور دریافت شد. وضعیت:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ پاسخ با موفقیت ثبت شد:', result);
      
      setUserScore(result.score);
      setHasAnswered(true);
      setIsActive(false);
      setChallengeCompleted(true);
      
      await loadChallengeStats();
      
    } else {
      // مدیریت خطاهای مختلف
      let errorMessage = 'خطا در ثبت پاسخ';
      
      if (response.status === 400) {
        errorMessage = 'پاسخ معتبر نیست';
      } else if (response.status === 404) {
        errorMessage = 'سوال پیدا نشد';
      } else if (response.status === 405) {
        errorMessage = 'متد غیرمجاز - با توسعه‌دهنده تماس بگیرید';
      } else if (response.status === 500) {
        errorMessage = 'خطای سرور';
      }
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.log('❌ خطا در parse پاسخ خطا:', parseError);
      }
      
      console.error('❌ خطا در ثبت پاسخ:', errorMessage);
      setError(errorMessage);
      alert(errorMessage);
    }
  } catch (error) {
    console.error('❌ خطا در ارسال پاسخ چالش:', error);
    setError('خطا در ارتباط با سرور چالش');
    alert('خطا در ارتباط با سرور');
  } finally {
    setLoading(false);
  }
};

  const handleTimeUp = () => {
    console.log('⏰ زمان به پایان رسید');
    setIsActive(false);
    if (!hasAnswered) {
      setChallengeCompleted(true);
    }
  };

  const resetChallenge = () => {
    console.log('🔄 ریست چالش');
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