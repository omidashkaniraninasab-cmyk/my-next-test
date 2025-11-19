'use client';
import { useState, useEffect } from 'react';

const MemoryGameStats = ({ currentUser, moves, score, gameCompleted }) => {
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadUserStats();
    }
  }, [currentUser, gameCompleted]);

  const loadUserStats = async () => {
    try {
      // این API رو بعداً می‌سازیم
      const response = await fetch(`/api/memory-cards/stats?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserStats(data.stats);
      }
    } catch (error) {
      console.error('خطا در دریافت آمار:', error);
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">برای مشاهده آمار وارد شوید</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-purple-200">
      <h3 className="text-xl font-bold text-purple-800 mb-4 text-center">
        📊 آمار شما
      </h3>
      
      <div className="space-y-3">
        {/* آمار جلسه فعلی */}
        <div className="bg-purple-50 rounded-lg p-3">
          <h4 className="font-bold text-purple-700 text-sm mb-2">🎮 این بازی:</h4>
          <div className="flex justify-between text-sm">
            <span>حرکت‌ها:</span>
            <span className="font-bold">{moves}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>امتیاز:</span>
            <span className="font-bold text-green-600">{score}</span>
          </div>
        </div>

        {/* آمار کلی */}
        {userStats && (
          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="font-bold text-blue-700 text-sm mb-2">📈 کلی:</h4>
            <div className="flex justify-between text-sm">
              <span>بهترین امتیاز:</span>
              <span className="font-bold text-green-600">{userStats.bestScore}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>کمترین حرکت:</span>
              <span className="font-bold">{userStats.bestMoves}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>تعداد بازی:</span>
              <span className="font-bold">{userStats.gamesPlayed}</span>
            </div>
          </div>
        )}

        {/* راهنمای امتیاز */}
        <div className="bg-yellow-50 rounded-lg p-3">
          <h4 className="font-bold text-yellow-700 text-sm mb-1">🎯 امتیازدهی:</h4>
          <div className="text-xs text-yellow-600 space-y-1">
            <div className="flex justify-between">
              <span>امتیاز پایه:</span>
              <span className="font-bold">1000</span>
            </div>
            <div className="flex justify-between">
              <span>کسر هر حرکت:</span>
              <span className="font-bold">20</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryGameStats;