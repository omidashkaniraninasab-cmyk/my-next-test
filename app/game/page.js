'use client';
import { useState, useEffect } from 'react';

// داده نمونه برای جدول کراسورد
const samplePuzzle = {
  id: 1,
  title: "جدول تستی",
  size: 5,
  grid: [
    [1, 1, 1, 0, 1],    // 1 = خانه سفید, 0 = خانه سیاه
    [1, 1, 1, 1, 1],
    [1, 0, 1, 1, 1],
    [1, 1, 1, 0, 1],
    [1, 1, 1, 1, 1]
  ],
  solution: [
    ['س', 'ا', 'ل', '', 'م'],
    ['ع', 'ل', 'ی', 'ر', 'ض'],
    ['ک', '', 'ت', 'ا', 'ب'],
    ['م', 'ه', 'د', '', 'ی'],
    ['ف', 'ا', 'ر', 'د', 'ا']
  ],
  across: {
    1: { clue: "کلمه خوشامدگویی", start: [0,0], length: 3 },
    2: { clue: "یک نام پسرانه", start: [1,0], length: 5 },
    3: { clue: "وسیله مطالعه", start: [2,2], length: 3 },
    4: { clue: "یک نام پسرانه", start: [3,0], length: 3 },
    5: { clue: "یک نام دخترانه", start: [4,0], length: 5 }
  },
  down: {
    1: { clue: "حرف اول فارسی", start: [0,0], length: 5 },
    2: { clue: "وسیله نقلیه", start: [0,1], length: 5 },
    3: { clue: "نوشیدنی", start: [0,4], length: 5 }
  }
};

export default function GamePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [puzzle, setPuzzle] = useState(samplePuzzle);
  const [userInput, setUserInput] = useState(Array(5).fill().map(() => Array(5).fill('')));
  const [cellStatus, setCellStatus] = useState(Array(5).fill().map(() => Array(5).fill('empty'))); // empty, correct, wrong
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [selectedCell, setSelectedCell] = useState([0, 0]);
  const [gameCompleted, setGameCompleted] = useState(false);

  // بررسی کاربر لاگین شده
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // اگر کاربر لاگین نکرده باشد
  if (!currentUser) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>⚠️ برای بازی باید وارد حساب کاربری خود شوید</h2>
        <p>لطفاً ابتدا ثبت‌نام کنید یا وارد شوید</p>
        <a href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>
          ← بازگشت به صفحه اصلی
        </a>
      </div>
    );
  }

  // انتخاب خانه
  const handleCellSelect = (row, col) => {
    if (puzzle.grid[row][col] === 1) { // فقط خانه‌های سفید قابل انتخاب هستند
      setSelectedCell([row, col]);
    }
  };

  // ورود حرف
  const handleInput = (char) => {
    if (gameCompleted) return;

    const [row, col] = selectedCell;
    const newInput = [...userInput];
    newInput[row][col] = char;
    setUserInput(newInput);

    // بررسی پاسخ
    const isCorrect = char === puzzle.solution[row][col];
    const newCellStatus = [...cellStatus];

    if (isCorrect) {
      newCellStatus[row][col] = 'correct';
      setScore(score + 3); // 3 امتیاز برای پاسخ درست
    } else {
      newCellStatus[row][col] = 'wrong';
      
      // محاسبه امتیاز منفی (اشتباه اول: 1-, دوم: 2-, ...)
      const mistakeCount = mistakes + 1;
      setMistakes(mistakeCount);
      setScore(score - mistakeCount);
    }

    setCellStatus(newCellStatus);

    // حرکت به خانه بعدی
    moveToNextCell(row, col);
  };

  // حرکت به خانه بعدی
  const moveToNextCell = (row, col) => {
    let nextRow = row;
    let nextCol = col + 1;

    if (nextCol >= puzzle.size) {
      nextRow++;
      nextCol = 0;
    }

    if (nextRow < puzzle.size) {
      // پیدا کردن خانه سفید بعدی
      while (nextRow < puzzle.size && puzzle.grid[nextRow][nextCol] === 0) {
        nextCol++;
        if (nextCol >= puzzle.size) {
          nextRow++;
          nextCol = 0;
        }
      }
      
      if (nextRow < puzzle.size) {
        setSelectedCell([nextRow, nextCol]);
      }
    }

    // بررسی تکمیل بازی
    checkGameCompletion();
  };

  // بررسی تکمیل بازی
  const checkGameCompletion = () => {
    let allCorrect = true;
    
    for (let i = 0; i < puzzle.size; i++) {
      for (let j = 0; j < puzzle.size; j++) {
        if (puzzle.grid[i][j] === 1 && cellStatus[i][j] !== 'correct') {
          allCorrect = false;
          break;
        }
      }
      if (!allCorrect) break;
    }

    if (allCorrect) {
      setGameCompleted(true);
      setScore(score + 50); // 50 امتیاز پاداش تکمیل
    }
  };

  // پایان بازی
  const handleFinishGame = () => {
    setGameCompleted(true);
    // اینجا اطلاعات بازی رو در دیتابیس ذخیره می‌کنیم
  };

  // صفحه کلید فارسی
  const persianKeyboard = [
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'چ'],
    ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک', 'گ'],
    ['ظ', 'ط', 'ز', 'ر', 'ذ', 'د', 'پ', 'و', 'ئ']
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* هدر بازی */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '10px'
      }}>
        <div>
          <h1 style={{ margin: 0 }}>🎮 {puzzle.title}</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            بازیکن: {currentUser.first_name} {currentUser.last_name}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>🎯 {score} امتیاز</div>
          <div style={{ color: '#666' }}>❌ {mistakes} اشتباه</div>
        </div>
      </div>

      {/* جدول کراسورد */}
      <div style={{ marginBottom: '40px' }}>
        <h2>جدول کلمات</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${puzzle.size}, 60px)`,
          gap: '2px',
          marginBottom: '20px'
        }}>
          {puzzle.grid.map((row, rowIndex) => (
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCellSelect(rowIndex, colIndex)}
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: cell === 0 ? '#333' : 
                    selectedCell[0] === rowIndex && selectedCell[1] === colIndex ? '#0070f3' :
                    cellStatus[rowIndex][colIndex] === 'correct' ? '#4CAF50' :
                    cellStatus[rowIndex][colIndex] === 'wrong' ? '#f44336' : '#fff',
                  border: '2px solid #ccc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  cursor: cell === 1 ? 'pointer' : 'default',
                  color: cellStatus[rowIndex][colIndex] === 'correct' ? '#fff' : '#000',
                  transition: 'all 0.2s'
                }}
              >
                {userInput[rowIndex][colIndex]}
              </div>
            ))
          ))}
        </div>

        {/* راهنما */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '20px',
          fontSize: '14px'
        }}>
          <div>
            <h3>➡️ افقی</h3>
            {Object.entries(puzzle.across).map(([num, clue]) => (
              <p key={num} style={{ margin: '5px 0' }}>
                <strong>{num}:</strong> {clue.clue}
              </p>
            ))}
          </div>
          <div>
            <h3>⬇️ عمودی</h3>
            {Object.entries(puzzle.down).map(([num, clue]) => (
              <p key={num} style={{ margin: '5px 0' }}>
                <strong>{num}:</strong> {clue.clue}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* صفحه کلید */}
      <div style={{ marginBottom: '30px' }}>
        <h2>صفحه کلید</h2>
        {persianKeyboard.map((row, rowIndex) => (
          <div key={rowIndex} style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '5px', 
            marginBottom: '10px' 
          }}>
            {row.map(char => (
              <button
                key={char}
                onClick={() => handleInput(char)}
                disabled={gameCompleted}
                style={{
                  padding: '10px 15px',
                  fontSize: '16px',
                  border: '1px solid #ccc',
                  backgroundColor: '#f0f0f0',
                  cursor: gameCompleted ? 'not-allowed' : 'pointer',
                  borderRadius: '5px',
                  minWidth: '40px'
                }}
              >
                {char}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* دکمه پایان بازی */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleFinishGame}
          disabled={gameCompleted}
          style={{
            padding: '12px 30px',
            fontSize: '16px',
            backgroundColor: gameCompleted ? '#4CAF50' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: gameCompleted ? 'default' : 'pointer'
          }}
        >
          {gameCompleted ? '✅ بازی تکمیل شد' : '⏹️ پایان بازی'}
        </button>
        
        {gameCompleted && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '5px' }}>
            🎉 تبریک! بازی با موفقیت تکمیل شد! +50 امتیاز پاداش
          </div>
        )}
      </div>
    </div>
  );
}