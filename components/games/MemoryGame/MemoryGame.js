'use client';
import { useEffect } from 'react'; // این خط رو اضافه کن
import { useMemoryGame } from '@/lib/hooks/useMemoryGame';
import MemoryCard from './MemoryCard';
import MemoryGameStats from './MemoryGameStats';
import MemoryGameLeaderboard from './MemoryGameLeaderboard';

const MemoryGame = ({ currentUser }) => {
  const {
    cards,
    flippedCards,
    matchedCards,
    moves,
    score,
    gameCompleted,
    loading,
    loadGame,
    handleCardClick,
    resetGame
  } = useMemoryGame(currentUser);

  useEffect(() => {
    if (currentUser) {
      loadGame('easy');
    }
  }, [currentUser]);

  return (
    <div className="space-y-6">
      {/* هدر بازی */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🎴 بازی کارت‌های حافظه</h1>
          <p className="text-lg opacity-90">سوال و جواب فارسی - سیستم کاملاً مستقل</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ستون راست: آمار و رتبه‌بندی */}
        <div className="lg:col-span-1 space-y-6">
          <MemoryGameStats 
            currentUser={currentUser}
            moves={moves}
            score={score}
            gameCompleted={gameCompleted}
          />
          <MemoryGameLeaderboard />
        </div>

        {/* ستون وسط: صفحه بازی */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
            
            {!currentUser ? (
              <div className="text-center py-8">
                <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-6 inline-block">
                  <h3 className="text-xl font-bold text-yellow-800 mb-2">⚠️ برای بازی باید وارد شوید</h3>
                  <p className="text-yellow-600">لطفاً ابتدا وارد حساب کاربری خود شوید</p>
                </div>
              </div>
            ) : loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">در حال بارگذاری بازی...</p>
              </div>
            ) : (
              <>
                {/* اطلاعات بازی */}
                <div className="text-center mb-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm inline-block">
                    <div className="flex gap-8 justify-center">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">حرکت‌ها</div>
                        <div className="text-2xl font-bold text-purple-600">{moves}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">امتیاز</div>
                        <div className="text-2xl font-bold text-green-600">{score}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">جفت‌ها</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {matchedCards.length / 2} / {cards.length / 2}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* صفحه کارت‌ها */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {cards.map((card) => (
                    <MemoryCard
                      key={card.id}
                      card={card}
                      isFlipped={flippedCards.includes(card.id) || matchedCards.includes(card.id)}
                      isMatched={matchedCards.includes(card.id)}
                      onClick={() => handleCardClick(card.id)}
                    />
                  ))}
                </div>

                {/* پیام پایان بازی */}
                {gameCompleted && (
                  <div className="text-center">
                    <div className="bg-green-100 border-2 border-green-400 rounded-lg p-6 mb-4">
                      <h3 className="text-2xl font-bold text-green-800 mb-2">🎉 برنده شدید!</h3>
                      <p className="text-green-700">
                        شما بازی را با {moves} حرکت و {score} امتیاز به پایان رساندید!
                      </p>
                    </div>
                    <button
                      onClick={resetGame}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-bold text-lg transition-all duration-300"
                    >
                      🔄 بازی جدید
                    </button>
                  </div>
                )}

                {/* راهنما */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-2 text-center">🎯 راهنمای بازی:</h4>
                  <div className="text-sm text-gray-700 text-center">
                    <p>کارت‌ها را برگردانید و جفت سوال و جواب را پیدا کنید!</p>
                    <p className="mt-1">امتیاز پایه: ۱۰۰۰ - هر حرکت: ۲۰- امتیاز</p>
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

export default MemoryGame;