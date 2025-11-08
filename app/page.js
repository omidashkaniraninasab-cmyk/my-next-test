'use client';
import { useState, useEffect } from 'react';

// داده نمونه برای جدول کراسورد
const samplePuzzle = {
  id: 1,
  title: "جدول کراسورد",
  size: 5,
  grid: [
    [1, 1, 1, 0, 1],
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

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // حالت‌های بازی
  const [showGame, setShowGame] = useState(false);
  const [userInput, setUserInput] = useState(Array(5).fill().map(() => Array(5).fill('')));
  const [cellStatus, setCellStatus] = useState(Array(5).fill().map(() => Array(5).fill('empty')));
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [selectedCell, setSelectedCell] = useState([0, 0]);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [currentGameId, setCurrentGameId] = useState(null);

  // وقتی صفحه لود شد، کاربر لاگین شده رو از localStorage بگیر
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      // امتیاز کاربر رو از دیتابیس بگیر
      fetchUserStats(user.id);
    }
    fetchUsers();
  }, []);

  const fetchUserStats = async (userId) => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const userData = await response.json();
        const currentUserData = userData.find(user => user.id === userId);
        if (currentUserData) {
          setCurrentUser(currentUserData);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // شروع بازی جدید
  const startNewGame = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          userId: currentUser.id,
          gameData: { puzzle: samplePuzzle }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentGameId(data.game.id);
        setShowGame(true);
        setScore(0);
        setMistakes(0);
        setUserInput(Array(5).fill().map(() => Array(5).fill('')));
        setCellStatus(Array(5).fill().map(() => Array(5).fill('empty')));
        setSelectedCell([0, 0]);
        setGameCompleted(false);
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  // آپدیت پیشرفت بازی در دیتابیس
  const updateGameInDB = async (progress, currentScore, currentMistakes) => {
    if (!currentGameId) return;

    try {
      await fetch('/api/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          userId: currentUser.id,
          gameData: { 
            gameId: currentGameId,
            progress: progress
          },
          score: currentScore,
          mistakes: currentMistakes
        }),
      });
    } catch (error) {
      console.error('Error updating game:', error);
    }
  };

  // تکمیل بازی و ذخیره در دیتابیس
  const completeGameInDB = async (finalScore) => {
    if (!currentGameId) return;

    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'complete',
          userId: currentUser.id,
          gameData: { gameId: currentGameId },
          score: finalScore
        }),
      });

      if (response.ok) {
        // آپدیت اطلاعات کاربر
        await fetchUserStats(currentUser.id);
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error completing game:', error);
    }
  };

  // انتخاب خانه
  const handleCellSelect = (row, col) => {
    if (samplePuzzle.grid[row][col] === 1) {
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
    const isCorrect = char === samplePuzzle.solution[row][col];
    const newCellStatus = [...cellStatus];

    if (isCorrect) {
      newCellStatus[row][col] = 'correct';
      const newScore = score + 3;
      setScore(newScore);
    } else {
      newCellStatus[row][col] = 'wrong';
      const mistakeCount = mistakes + 1;
      setMistakes(mistakeCount);
      const newScore = score - mistakeCount;
      setScore(newScore);
    }

    setCellStatus(newCellStatus);

    // آپدیت دیتابیس
    updateGameInDB({ userInput: newInput, cellStatus: newCellStatus }, score, mistakes);

    // حرکت به خانه بعدی
    moveToNextCell(row, col);
  };

  // حرکت به خانه بعدی
  const moveToNextCell = (row, col) => {
    let nextRow = row;
    let nextCol = col + 1;

    if (nextCol >= samplePuzzle.size) {
      nextRow++;
      nextCol = 0;
    }

    if (nextRow < samplePuzzle.size) {
      while (nextRow < samplePuzzle.size && samplePuzzle.grid[nextRow][nextCol] === 0) {
        nextCol++;
        if (nextCol >= samplePuzzle.size) {
          nextRow++;
          nextCol = 0;
        }
      }
      
      if (nextRow < samplePuzzle.size) {
        setSelectedCell([nextRow, nextCol]);
      }
    }

    checkGameCompletion();
  };

  // بررسی تکمیل بازی
  const checkGameCompletion = () => {
    let allCorrect = true;
    
    for (let i = 0; i < samplePuzzle.size; i++) {
      for (let j = 0; j < samplePuzzle.size; j++) {
        if (samplePuzzle.grid[i][j] === 1 && cellStatus[i][j] !== 'correct') {
          allCorrect = false;
          break;
        }
      }
      if (!allCorrect) break;
    }

    if (allCorrect) {
      const finalScore = score + 50; // 50 امتیاز پاداش
      setScore(finalScore);
      setGameCompleted(true);
      completeGameInDB(finalScore);
    }
  };

  // پایان بازی
  const handleFinishGame = () => {
    setGameCompleted(true);
    completeGameInDB(score);
  };

  // صفحه کلید فارسی
  const persianKeyboard = [
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'چ'],
    ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک', 'گ'],
    ['ظ', 'ط', 'ز', 'ر', 'ذ', 'د', 'پ', 'و', 'ئ']
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* هدر */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '10px'
      }}>
        <h1 style={{ margin: 0 }}>🎯 وبسایت کراسورد</h1>
        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold' }}>{currentUser.first_name} {currentUser.last_name}</div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                🎯 امتیاز کل: {currentUser.total_crossword_score || 0}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: '#666' }}>👤 مهمان</div>
        )}
      </div>

      {/* بازی کراسورد */}
      {showGame ? (
        <div style={{ marginBottom: '40px' }}>
          {/* هدر بازی */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '30px',
            padding: '15px',
            backgroundColor: '#e3f2fd',
            borderRadius: '10px'
          }}>
            <div>
              <h2 style={{ margin: 0 }}>🎮 {samplePuzzle.title}</h2>
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
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${samplePuzzle.size}, 60px)`,
              gap: '2px',
              marginBottom: '20px'
            }}>
              {samplePuzzle.grid.map((row, rowIndex) => (
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
                {Object.entries(samplePuzzle.across).map(([num, clue]) => (
                  <p key={num} style={{ margin: '5px 0' }}>
                    <strong>{num}:</strong> {clue.clue}
                  </p>
                ))}
              </div>
              <div>
                <h3>⬇️ عمودی</h3>
                {Object.entries(samplePuzzle.down).map(([num, clue]) => (
                  <p key={num} style={{ margin: '5px 0' }}>
                    <strong>{num}:</strong> {clue.clue}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* صفحه کلید */}
          <div style={{ marginBottom: '30px' }}>
            <h3>صفحه کلید</h3>
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

          {/* دکمه‌های بازی */}
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
                cursor: gameCompleted ? 'default' : 'pointer',
                marginRight: '10px'
              }}
            >
              {gameCompleted ? '✅ بازی تکمیل شد' : '⏹️ پایان بازی'}
            </button>

            <button
              onClick={() => setShowGame(false)}
              style={{
                padding: '12px 30px',
                fontSize: '16px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              ↩️ بازگشت
            </button>
            
            {gameCompleted && (
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '5px' }}>
                🎉 تبریک! بازی با موفقیت تکمیل شد! +50 امتیاز پاداش
              </div>
            )}
          </div>
        </div>
      ) : (
        /* صفحه اصلی وقتی بازی نمایش داده نمی‌شود */
        <div>
          {/* دکمه شروع بازی */}
          {currentUser && (
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <button
                onClick={startNewGame}
                style={{
                  padding: '15px 40px',
                  fontSize: '18px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🎮 شروع بازی جدید
              </button>
            </div>
          )}

          {/* بقیه محتوای صفحه اصلی */}
          {/* ... کدهای قبلی صفحه اصلی */}
        </div>
      )}

      {/* بقیه کدهای صفحه اصلی */}
    </div>
  );
}