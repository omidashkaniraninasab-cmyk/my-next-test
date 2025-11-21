'use client';
import { useState, useEffect } from 'react';

const MemoryGameLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/memory-game/leaderboard');
      
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error('خطا در بارگذاری رتبه‌بندی بازی حافظه:', error);
    } finally {
      setLoading(false);
    }
  };

  // تابع برای نمایش ایمن userId
  const formatUserId = (userId) => {
    if (!userId) return 'ناشناس';
    
    // تبدیل به string و سپس slice
    const userIdStr = String(userId);
    return userIdStr.length > 8 ? `${userIdStr.slice(0, 8)}...` : userIdStr;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">در حال بارگذاری رتبه‌بندی بازی حافظه...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* هدر رتبه‌بندی بازی حافظه */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
        <h3 className="text-xl font-bold text-center">🏆 رتبه‌بندی بازی حافظه</h3>
        <p className="text-center opacity-90 text-sm">سیستم کاملاً مستقل</p>
      </div>

      {/* لیست رتبه‌ها */}
      <div className="max-h-96 overflow-y-auto">
        {leaderboard.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            هنوز کسی در بازی حافظه شرکت نکرده است
          </div>
        ) : (
          leaderboard.map((user, index) => (
            <div
              key={user.userId}
              className={`flex items-center justify-between p-4 border-b ${
                index < 3 ? 'bg-gradient-to-r from-purple-50 to-pink-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                {/* رتبه */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
                  ${index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    index === 2 ? 'bg-orange-500' : 'bg-purple-500'}
                `}>
                  {index + 1}
                </div>

                {/* اطلاعات کاربر */}
                <div>
                  <div className="font-bold text-gray-800">
                    {/* 🔥 FIX: استفاده از تابع formatUserId به جای slice مستقیم */}
                    کاربر {formatUserId(user.userId)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {user.gamesPlayed} بازی
                  </div>
                </div>
              </div>

              {/* امتیاز بازی حافظه */}
              <div className="text-left">
                <div className="font-bold text-lg text-green-600">
                  {user.totalScore}
                </div>
                <div className="text-sm text-gray-500">
                  بهترین زمان: {user.bestTime} ثانیه
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* فوتر */}
      <div className="bg-gray-50 p-3 text-center">
        <button 
          onClick={loadLeaderboard}
          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
        >
          🔄 بروزرسانی
        </button>
      </div>
    </div>
  );
};

export default MemoryGameLeaderboard;