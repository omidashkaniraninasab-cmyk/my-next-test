'use client';

const ChallengeTimer = ({ timeLeft, isActive }) => {
  const getTimerColor = () => {
    if (timeLeft <= 3) return 'bg-red-500';
    if (timeLeft <= 7) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className={`
      inline-flex items-center px-4 py-2 rounded-full text-white font-bold text-lg
      ${getTimerColor()} transition-all duration-300
      ${!isActive ? 'bg-gray-500' : ''}
    `}>
      ⏰ {timeLeft} ثانیه
    </div>
  );
};

export default ChallengeTimer;