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
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    bankCardNumber: ''
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // حالت‌های بازی
  const [userInput, setUserInput] = useState(Array(5).fill().map(() => Array(5).fill('')));
  const [cellStatus, setCellStatus] = useState(Array(5).fill().map(() => Array(5).fill('empty')));
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [selectedCell, setSelectedCell] = useState([0, 0]);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [currentGameId, setCurrentGameId] = useState(null);

  // وقتی صفحه لود شد
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      fetchUserStats(user.id);
      startNewGame(user.id);
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
  const startNewGame = async (userId) => {
    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          userId: userId,
          gameData: { puzzle: samplePuzzle }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentGameId(data.game.id);
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newUser = await response.json();
        setCurrentUser(newUser.user);
        localStorage.setItem('currentUser', JSON.stringify(newUser.user));
        setFormData({
          username: '',
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          bankCardNumber: ''
        });
        await fetchUsers();
        startNewGame(newUser.user.id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setUserInput(Array(5).fill().map(() => Array(5).fill('')));
    setCellStatus(Array(5).fill().map(() => Array(5).fill('empty')));
    setScore(0);
    setMistakes(0);
    setSelectedCell([0, 0]);
    setGameCompleted(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // انتخاب خانه
  const handleCellSelect = (row, col) => {
    if (samplePuzzle.grid[row][col] === 1) {
      setSelectedCell([row, col]);
    }
  };

  // ورود حرف
  const handleInput = (char) => {
    if (gameCompleted || !currentUser) return;

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
      const finalScore = score + 50;
      setScore(finalScore);
      setGameCompleted(true);
    }
  };

  // صفحه کلید فارسی
  const persianKeyboard = [
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'چ'],
    ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک', 'گ'],
    ['ظ', 'ط', 'ز', 'ر', 'ذ', 'د', 'پ', 'و', 'ئ']
  ];

  // آمار
  const totalUsers = users.length;
  const totalScore = users.reduce((sum, user) => sum + (user.total_crossword_score || 0), 0);

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
            <div 
              onClick={handleLogout}
              style={{ 
                padding: '8px 15px', 
                backgroundColor: '#ff4444', 
                color: 'white', 
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              خروج
            </div>
          </div>
        ) : (
          <div style={{ color: '#666' }}>👤 مهمان</div>
        )}
      </div>
      
      {/* آمار لحظه‌ای */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '15px', 
        marginBottom: '30px' 
      }}>
        <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{totalUsers}</div>
          <div>👥 کاربران</div>
        </div>
        <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{totalScore}</div>
          <div>🎯 امتیاز کل</div>
        </div>
      </div>

      {/* بازی کراسورد */}
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
              {currentUser ? `بازیکن: ${currentUser.first_name} ${currentUser.last_name}` : 'برای بازی ثبت‌نام کنید'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>🎯 {score} امتیاز</div>
            <div style={{ color: '#666' }}>❌ {mistakes} اشتباه</div>
          </div>
        </div>

        {/* اگر کاربر لاگین نکرده باشد */}
        {!currentUser && (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            backgroundColor: '#fff3cd', 
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <h3>⚠️ برای بازی باید ثبت‌نام کنید</h3>
            <p>لطفاً در فرم زیر ثبت‌نام کنید تا بتوانید بازی کنید</p>
          </div>
        )}

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
                  onClick={() => currentUser && handleCellSelect(rowIndex, colIndex)}
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
                    cursor: currentUser && cell === 1 ? 'pointer' : 'default',
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

        {/* صفحه کلید - فقط برای کاربران لاگین شده */}
        {currentUser && (
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
                  <div
                    key={char}
                    onClick={() => handleInput(char)}
                    style={{
                      padding: '10px 15px',
                      fontSize: '16px',
                      border: '1px solid #ccc',
                      backgroundColor: '#f0f0f0',
                      cursor: gameCompleted ? 'default' : 'pointer',
                      borderRadius: '5px',
                      minWidth: '40px',
                      textAlign: 'center'
                    }}
                  >
                    {char}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* پیام تکمیل بازی */}
        {gameCompleted && (
          <div style={{ 
            marginTop: '15px', 
            padding: '15px', 
            backgroundColor: '#e8f5e8', 
            borderRadius: '5px',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            🎉 تبریک! بازی با موفقیت تکمیل شد! +50 امتیاز پاداش
          </div>
        )}
      </div>

      {/* فرم ثبت‌نام - فقط برای کاربران لاگین نشده */}
      {!currentUser && (
        <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
          <h2>ثبت‌نام در سایت</h2>
          <form onSubmit={handleRegister}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <div>
                <label>نام کاربری: </label>
                <input 
                  type="text" 
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  style={{ padding: '8px', width: '100%', marginTop: '5px' }}
                />
              </div>

              <div>
                <label>ایمیل: </label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  style={{ padding: '8px', width: '100%', marginTop: '5px' }}
                />
              </div>

              <div>
                <label>پسورد: </label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  style={{ padding: '8px', width: '100%', marginTop: '5px' }}
                />
              </div>

              <div>
                <label>نام: </label>
                <input 
                  type="text" 
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  style={{ padding: '8px', width: '100%', marginTop: '5px' }}
                />
              </div>

              <div>
                <label>نام خانوادگی: </label>
                <input 
                  type="text" 
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  style={{ padding: '8px', width: '100%', marginTop: '5px' }}
                />
              </div>

              <div>
                <label>شماره کارت بانکی: </label>
                <input 
                  type="text" 
                  name="bankCardNumber"
                  value={formData.bankCardNumber}
                  onChange={handleInputChange}
                  style={{ padding: '8px', width: '100%', marginTop: '5px' }}
                />
              </div>
            </div>
            
            <div 
              onClick={handleRegister}
              style={{ 
                marginTop: '20px',
                padding: '12px 30px', 
                backgroundColor: loading ? '#ccc' : '#0070f3', 
                color: 'white', 
                borderRadius: '5px',
                cursor: loading ? 'default' : 'pointer',
                textAlign: 'center',
                display: 'inline-block'
              }}
            >
              {loading ? 'در حال ثبت...' : 'ثبت‌نام و ورود'}
            </div>
          </form>
        </div>
      )}

      {/* لیست کاربران */}
      <div>
        <h2>لیست کاربران</h2>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
          🔄 به روزرسانی خودکار
        </div>
        {users.length === 0 ? (
          <p>هنوز کاربری ثبت‌نام نکرده است</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {users.map(user => (
              <div key={user.id} style={{ 
                padding: '15px', 
                border: '1px solid #ddd', 
                borderRadius: '8px',
                backgroundColor: currentUser && user.id === currentUser.id ? '#e3f2fd' : '#f9f9f9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <strong>👤 {user.username}</strong> - {user.first_name} {user.last_name}
                    {currentUser && user.id === currentUser.id && <span style={{color: 'green'}}> (شما)</span>}
                    <br />
                    📧 {user.email}
                    <br />
                    🎯 امتیاز کل: <strong>{user.total_crossword_score || 0}</strong>
                    <br />
                    🎮 بازی‌ها: {user.crossword_games_played || 0}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>
                    ⏰ {new Date(user.registration_date).toLocaleString('fa-IR')}
                    <br />
                    🏆 رتبه: {user.crossword_rank || 'جدید'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}