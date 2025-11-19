'use client';
import { useDailyChallenge } from '@/lib/hooks/useDailyChallenge';
import ChallengeTimer from './ChallengeTimer';
import DailyChallengeLeaderboard from './DailyChallengeLeaderboard';

const DailyChallenge = ({ currentUser }) => {
  const {
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
    submitAnswer,
    resetChallenge
  } = useDailyChallenge(currentUser);

  return (
    <div className="space-y-6">
      {/* هدر بخش چالش - کاملاً مستقل */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🎯 چالش سریع روزانه</h1>
          <p className="text-lg opacity-90"> سیستم کاملاً مستقل از کراسورد - رتبه‌بندی جداگانه  </p>
          <p className="text-lg opacity-90"> زمان بازی: ۱۵ ثانیه  </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ستون سمت راست: آمار کاربر در چالش */}
        <div className="lg:col-span-1">
          {currentUser && challengeStats && (
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-green-200">
              <h3 className="text-xl font-bold text-green-800 mb-4 text-center">
                📊 آمار شما در چالش
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700">امتیاز کل چالش:</span>
                  <span className="font-bold text-lg text-green-800">{challengeStats.totalScore}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-700">امتیاز امروز:</span>
                  <span className="font-bold text-lg text-blue-800">{challengeStats.todayScore}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-purple-700">تعداد بازی‌ها:</span>
                  <span className="font-bold text-lg text-purple-800">{challengeStats.gamesPlayed}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-orange-700">رتبه در چالش:</span>
                  <span className="font-bold text-lg text-orange-800">
                    {challengeStats.rank > 0 ? `#${challengeStats.rank}` : '---'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* رتبه‌بندی چالش */}
          <div className="mt-6">
            <DailyChallengeLeaderboard />
          </div>
        </div>

        {/* ستون وسط: بازی چالش */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6 shadow-lg">
            
            {!currentUser ? (
              <div className="text-center py-8">
                <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-6 inline-block">
                  <h3 className="text-xl font-bold text-yellow-800 mb-2">⚠️ برای شرکت در چالش باید وارد شوید</h3>
                  <p className="text-yellow-600">لطفاً ابتدا وارد حساب کاربری خود شوید</p>
                </div>
              </div>
            ) : !currentQuestion ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">در حال بارگذاری چالش روزانه...</p>
              </div>
            ) : (
              <>
                {/* سوال و تایمر */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 bg-white py-4 px-6 rounded-lg shadow-sm border-2 border-green-300">
                    {currentQuestion.text}
                  </h3>
                  <ChallengeTimer timeLeft={timeLeft} isActive={isActive} />
                </div>

                {/* فرم پاسخ‌دهی */}
                {!hasAnswered && isActive && (
                  <div className="text-center space-y-4">
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="پاسخ خود را وارد کنید..."
                      className="w-64 px-4 py-3 border-2 border-green-300 rounded-lg text-center text-lg font-bold focus:border-green-500 focus:outline-none"
                      dir="rtl"
                      onKeyPress={(e) => e.key === 'Enter' && !loading && submitAnswer()}
                      disabled={loading}
                    />
                    <br />
                    <button 
  onClick={(e) => submitAnswer(e)} // e رو پاس بده
  disabled={loading}
  className={`px-8 py-3 rounded-lg font-bold text-lg transition-all duration-300 shadow-md hover:shadow-lg ${
    loading 
      ? 'bg-gray-400 cursor-not-allowed' 
      : 'bg-green-500 hover:bg-green-600 text-white'
  }`}
>
  {loading ? '⏳ در حال ثبت...' : '🚀 ارسال پاسخ'}
</button>
                  </div>
                )}

                {/* نتایج */}
                {(hasAnswered || challengeCompleted) && (
                  <div className="text-center space-y-4">
                    {hasAnswered ? (
                      <>
                        <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4">
                          <p className="text-green-800 font-bold text-lg">✅ پاسخ شما در چالش ثبت شد!</p>
                          <p className="text-gray-700 mt-2">پاسخ شما: <strong className="text-green-800">{userAnswer}</strong></p>
                        </div>
                        
                        {userScore > 0 && (
                          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4">
                            <p className="text-yellow-800 font-bold text-xl">🏆 امتیاز شما در چالش: {userScore}</p>
                            <p className="text-gray-600 text-sm mt-2">
                              {userScore === 1000 ? '🎉 پاسخ منحصر به فرد! عالی!' : 
                              userScore >= 750 ? '💫 پاسخ کم‌تکرار! خوبه!' : 
                              '👍 پاسخ معمولی!'}
                            </p>
                            <p className="text-green-600 text-sm mt-1 font-bold">
                              ✅ این امتیاز فقط به حساب چالش اضافه شد
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4">
                        <p className="text-red-800 font-bold text-lg">⏰ زمان به پایان رسید!</p>
                        <p className="text-gray-600 mt-2">فرصت پاسخ‌دهی به پایان رسید</p>
                      </div>
                    )}

                    <button 
                      onClick={resetChallenge}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-bold transition-all duration-300"
                    >
                      🔄 چالش جدید
                    </button>
                  </div>
                )}

                {/* راهنمای امتیازدهی چالش */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-2 text-center">📋 راهنمای امتیازدهی چالش:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                    <p>🎯 پاسخ منحصر به فرد: <strong>1000</strong> امتیاز</p>
                    <p>⭐ ۲-۱۰ کاربر مشابه: <strong>750</strong> امتیاز</p>
                    <p>🔸 ۱۱-۱۰۰ کاربر مشابه: <strong>500</strong> امتیاز</p>
                    <p>🔹 ۱۰۱-۱۰۰۰ کاربر مشابه: <strong>250</strong> امتیاز</p>
                    <p className="md:col-span-2 text-center">📊 بیش از ۱۰۰۰ کاربر: <strong>100</strong> امتیاز</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyChallenge;