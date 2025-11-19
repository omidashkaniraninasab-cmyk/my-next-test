'use client';

const MemoryCard = ({ card, isFlipped, isMatched, onClick }) => {
  const getCardColor = () => {
    if (isMatched) {
      return 'bg-green-500 border-green-600 text-white';
    }
    if (isFlipped) {
      return card.type === 'question' 
        ? 'bg-blue-500 border-blue-600 text-white' 
        : 'bg-green-500 border-green-600 text-white';
    }
    return 'bg-purple-500 border-purple-600 text-white hover:bg-purple-600 cursor-pointer';
  };

  const getCardContent = () => {
    if (!isFlipped && !isMatched) {
      return '?';
    }
    
    if (card.type === 'question') {
      return (
        <div className="text-center">
          <div className="text-xs opacity-80 mb-1">سوال</div>
          <div className="font-bold text-sm leading-tight">{card.content}</div>
        </div>
      );
    } else {
      return (
        <div className="text-center">
          <div className="text-xs opacity-80 mb-1">جواب</div>
          <div className="font-bold text-sm leading-tight">{card.content}</div>
        </div>
      );
    }
  };

  return (
    <div
      onClick={!isMatched ? onClick : undefined}
      className={`
        w-20 h-24 rounded-lg border-2 flex items-center justify-center
        transition-all duration-300 transform
        ${getCardColor()}
        ${isFlipped || isMatched ? 'scale-105 rotate-0' : 'hover:scale-105'}
        ${!isFlipped && !isMatched ? 'hover:shadow-lg' : ''}
        font-bold text-lg
      `}
      style={{
        cursor: isMatched ? 'default' : 'pointer'
      }}
    >
      {getCardContent()}
    </div>
  );
};

export default MemoryCard;