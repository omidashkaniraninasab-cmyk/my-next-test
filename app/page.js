'use client';
import { useState, useEffect } from 'react';
import ProgressChart from '../components/ProgressChart';
import { dailyPuzzleData } from '../lib/dailyPuzzleData';
import { PuzzleGenerator } from '../lib/puzzleGenerator';
import { DailyPuzzle } from '../lib/dailyPuzzle';

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
  const [userInput, setUserInput] = useState([]);
  const [cellStatus, setCellStatus] = useState([]);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [selectedCell, setSelectedCell] = useState([0, 0]);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [currentGameId, setCurrentGameId] = useState(null);
  const [puzzleSize, setPuzzleSize] = useState(5);
  const [availableSizes] = useState([3, 4, 5, 6, 7, 8]);
  const [dailyPuzzle, setDailyPuzzle] = useState(null);

  // وقتی صفحه لود شد
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedPuzzle = localStorage.getItem('dailyPuzzle');
    const savedPuzzleDate = localStorage.getItem('dailyPuzzleDate');
    
    const today = new Date().toISOString().split('T')[0];
    
    // استفاده از dailyPuzzleData به عنوان جدول پیش‌فرض
    let puzzleToUse = dailyPuzzleData;
    
    if (!savedPuzzle || savedPuzzleDate !== today) {
      try {
        const newPuzzle = DailyPuzzle.getDailyPuzzle();
        setDailyPuzzle(newPuzzle);
        localStorage.setItem('dailyPuzzle', JSON.stringify(newPuzzle));
        localStorage.setItem('dailyPuzzleDate', today);
        puzzleToUse = newPuzzle;
      } catch (error) {
        console.error('Error creating daily puzzle:', error);
        // استفاده از dailyPuzzleData به عنوان fallback
        setDailyPuzzle(dailyPuzzleData);
        localStorage.setItem('dailyPuzzle', JSON.stringify(dailyPuzzleData));
        localStorage.setItem('dailyPuzzleDate', today);
      }
    } else {
      setDailyPuzzle(JSON.parse(savedPuzzle));
      puzzleToUse = JSON.parse(savedPuzzle);
    }
    
    // مقداردهی اولیه آرایه‌های بازی
    const size = puzzleToUse.size;
    setUserInput(Array(size).fill().map(() => Array(size).fill('')));
    setCellStatus(Array(size).fill().map(() => Array(size).fill('empty')));
    
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      fetchUserStats(user.id);
      startNewGame(user.id);
    }
    
    fetchUsers();
    
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
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

  // شروع بازی جدید با جدول روزانه
  const startNewGame = async (userId) => {
    try {
      const puzzle = dailyPuzzle || dailyPuzzleData;
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          userId: userId,
          gameData: { puzzle: puzzle }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentGameId(data.game.id);
        setScore(0);
        setMistakes(0);
        
        const size = puzzle.size;
        setUserInput(Array(size).fill().map(() => Array(size).fill('')));
        setCellStatus(Array(size).fill().map(() => Array(size).fill('empty')));
        setSelectedCell([0, 0]);
        setGameCompleted(false);
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  // آپدیت امتیاز کاربر در دیتابیس
  const updateUserScoreInDB = async (userId, additionalScore) => {
    try {
      const response = await fetch('/api/users/update-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          additionalScore: additionalScore
        }),
      });

      if (response.ok) {
        await fetchUserStats(userId);
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error updating score:', error);
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
    const puzzle = dailyPuzzle || dailyPuzzleData;
    const size = puzzle.size;
    setUserInput(Array(size).fill().map(() => Array(size).fill('')));
    setCellStatus(Array(size).fill().map(() => Array(size).fill('empty')));
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

  // انتخاب خانه - فقط خانه‌های قفل نشده قابل انتخاب هستند
  const handleCellSelect = (row, col) => {
    const puzzle = dailyPuzzle || dailyPuzzleData;
    if (puzzle.grid[row][col] === 1 && cellStatus[row][col] !== 'locked' && !gameCompleted) {
      setSelectedCell([row, col]);
    }
  };

  // ورود حرف
  const handleInput = async (char) => {
    if (gameCompleted || !currentUser) return;

    const [row, col] = selectedCell;
    const puzzle = dailyPuzzle || dailyPuzzleData;
    
    // اگر خانه قبلاً قفل شده باشد، کاری نکن
    if (cellStatus[row][col] === 'locked') return;

    const newInput = [...userInput];
    newInput[row][col] = char;
    setUserInput(newInput);

    // بررسی پاسخ
    const isCorrect = char === puzzle.solution[row][col];
    const newCellStatus = [...cellStatus];

    let scoreToAdd = 0;

    if (isCorrect) {
      newCellStatus[row][col] = 'locked';
      scoreToAdd = 3;
      const newScore = score + scoreToAdd;
      setScore(newScore);
    } else {
      newCellStatus[row][col] = 'wrong';
      scoreToAdd = -3;
      const newScore = score + scoreToAdd;
      setScore(newScore);
      setMistakes(mistakes + 1);
    }

    setCellStatus(newCellStatus);

    // ذخیره امتیاز در دیتابیس
    if (scoreToAdd !== 0) {
      await updateUserScoreInDB(currentUser.id, scoreToAdd);
    }

    // حرکت به خانه بعدی
    if (!isCorrect) {
      moveToNextCell(row, col);
    } else {
      findNextUnlockedCell();
    }
  };

  // پیدا کردن اولین خانه قفل نشده بعدی
  const findNextUnlockedCell = () => {
    const puzzle = dailyPuzzle || dailyPuzzleData;
    for (let i = 0; i < puzzle.size; i++) {
      for (let j = 0; j < puzzle.size; j++) {
        if (puzzle.grid[i][j] === 1 && cellStatus[i][j] !== 'locked') {
          setSelectedCell([i, j]);
          return;
        }
      }
    }
    checkGameCompletion();
  };

  // حرکت به خانه بعدی
  const moveToNextCell = (row, col) => {
    const puzzle = dailyPuzzle || dailyPuzzleData;
    let nextRow = row;
    let nextCol = col + 1;

    if (nextCol >= puzzle.size) {
      nextRow++;
      nextCol = 0;
    }

    if (nextRow < puzzle.size) {
      while (nextRow < puzzle.size && 
             (puzzle.grid[nextRow][nextCol] === 0 || cellStatus[nextRow][nextCol] === 'locked')) {
        nextCol++;
        if (nextCol >= puzzle.size) {
          nextRow++;
          nextCol = 0;
        }
        if (nextRow >= puzzle.size) break;
      }
      
      if (nextRow < puzzle.size) {
        setSelectedCell([nextRow, nextCol]);
      }
    }

    checkGameCompletion();
  };

  // بررسی تکمیل بازی
  const checkGameCompletion = async () => {
    const puzzle = dailyPuzzle || dailyPuzzleData;
    let allLocked = true;
    
    for (let i = 0; i < puzzle.size; i++) {
      for (let j = 0; j < puzzle.size; j++) {
        if (puzzle.grid[i][j] === 1 && cellStatus[i][j] !== 'locked') {
          allLocked = false;
          break;
        }
      }
      if (!allLocked) break;
    }

    if (allLocked && !gameCompleted) {
      const finalScore = score + 50;
      setScore(finalScore);
      setGameCompleted(true);
      
      await updateUserScoreInDB(currentUser.id, 50);
    }
  };

  // صفحه کلید فارسی
  const persianKeyboard = [
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'چ'],
    ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک', 'گ'],
    ['ظ', 'ط', 'ز', 'ر', 'ذ', 'د', 'پ', 'و', 'ئ']
  ];

  const puzzle = dailyPuzzle || dailyPuzzleData;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
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
          <h2 style={{ margin: 0 }}>🎮 {puzzle.title}</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            {currentUser ? `بازیکن: ${currentUser.first_name} ${currentUser.last_name}` : 'برای بازی ثبت‌نام کنید'}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>🎯 {score} امتیاز</div>
          <div style={{ color: '#666' }}>❌ {mistakes} اشتباه</div>
        </div>
      </div>

      {/* پروفایل کاربر لاگین شده */}
      {currentUser && (
        <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
          <h2>👤 پروفایل کاربری - {currentUser.first_name} {currentUser.last_name}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <h3>📋 اطلاعات شخصی</h3>
              <p><strong>نام کاربری:</strong> {currentUser.username}</p>
              <p><strong>نام و نام خانوادگی:</strong> {currentUser.first_name} {currentUser.last_name}</p>
              <p><strong>ایمیل:</strong> {currentUser.email}</p>
              <p><strong>تاریخ ثبت‌نام:</strong> {new Date(currentUser.registration_date).toLocaleString('fa-IR')}</p>
              {currentUser.bank_card_number && (
                <p><strong>شماره کارت:</strong> {currentUser.bank_card_number}</p>
              )}
            </div>
            
            <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <h3>🎮 اطلاعات بازی</h3>
              <p><strong>امتیاز کل:</strong> {currentUser.total_crossword_score || 0}</p>
              <p><strong>امتیاز امروز:</strong> {currentUser.today_crossword_score || 0}</p>
              <p><strong>امتیاز لحظه‌ای:</strong> {currentUser.instant_crossword_score || 0}</p>
              <p><strong>تعداد بازی‌ها:</strong> {currentUser.crossword_games_played || 0}</p>
              <p><strong>بازی‌های کامل:</strong> {currentUser.completed_crossword_games || 0}</p>
              <p><strong>بازی‌های ناتمام:</strong> {currentUser.incomplete_crossword_games || 0}</p>
              <p><strong>رتبه:</strong> {currentUser.crossword_rank || 'جدید'}</p>
            </div>

            <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <h3>⏰ زمان‌بندی</h3>
              <p><strong>ورود امروز:</strong> {currentUser.today_login_time ? new Date(currentUser.today_login_time).toLocaleString('fa-IR') : 'ثبت نشده'}</p>
              <p><strong>خروج امروز:</strong> {currentUser.today_logout_time ? new Date(currentUser.today_logout_time).toLocaleString('fa-IR') : 'ثبت نشده'}</p>
            </div>
          </div>
        </div>
      )}

      {/* نمودارهای پیشرفت */}
      <ProgressChart users={users} currentUser={currentUser} />

      {/* اطلاعات جدول روزانه */}
      {dailyPuzzle && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '10px' }}>
          <h3>📅 جدول روزانه</h3>
          <p style={{ margin: '5px 0', fontWeight: 'bold' }}>{dailyPuzzle.title}</p>
          <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
            سایز: {dailyPuzzle.size}×{dailyPuzzle.size} | 
            امروز همه کاربران این جدول رو حل می‌کنند
          </p>
        </div>
      )}

      {/* بازی کراسورد */}
      <div style={{ marginBottom: '40px' }}>
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
            gridTemplateColumns: `repeat(${puzzle.size}, 60px)`,
            gap: '2px',
            marginBottom: '20px'
          }}>
            {puzzle.grid.map((row, rowIndex) => (
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => currentUser && handleCellSelect(rowIndex, colIndex)}
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: cell === 0 ? '#333' : 
                      selectedCell[0] === rowIndex && selectedCell[1] === colIndex ? '#0070f3' :
                      cellStatus[rowIndex] && cellStatus[rowIndex][colIndex] === 'locked' ? '#2E7D32' :
                      cellStatus[rowIndex] && cellStatus[rowIndex][colIndex] === 'correct' ? '#4CAF50' :
                      cellStatus[rowIndex] && cellStatus[rowIndex][colIndex] === 'wrong' ? '#f44336' : '#fff',
                    border: cellStatus[rowIndex] && cellStatus[rowIndex][colIndex] === 'locked' ? '2px solid #1B5E20' : '2px solid #ccc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    cursor: currentUser && cell === 1 && cellStatus[rowIndex] && cellStatus[rowIndex][colIndex] !== 'locked' && !gameCompleted ? 'pointer' : 'default',
                    color: (cellStatus[rowIndex] && cellStatus[rowIndex][colIndex] === 'locked') || (cellStatus[rowIndex] && cellStatus[rowIndex][colIndex] === 'correct') ? '#fff' : '#000',
                    transition: 'all 0.2s',
                    opacity: cellStatus[rowIndex] && cellStatus[rowIndex][colIndex] === 'locked' ? 0.8 : 1
                  }}
                >
                  {userInput[rowIndex] && userInput[rowIndex][colIndex]}
                  {cellStatus[rowIndex] && cellStatus[rowIndex][colIndex] === 'locked' && ' 🔒'}
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

          {/* صفحه کلید - فقط برای کاربران لاگین شده */}
          {currentUser && !gameCompleted && (
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
                        cursor: 'pointer',
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
            
            <button
              type="submit"
              style={{ 
                marginTop: '20px',
                padding: '12px 30px', 
                backgroundColor: loading ? '#ccc' : '#0070f3', 
                color: 'white', 
                borderRadius: '5px',
                cursor: loading ? 'default' : 'pointer',
                textAlign: 'center',
                display: 'inline-block',
                border: 'none'
              }}
              disabled={loading}
            >
              {loading ? 'در حال ثبت...' : 'ثبت‌نام و ورود'}
            </button>
          </form>
        </div>
      )}

      {/* لیست کاربران - مرتب شده بر اساس امتیاز کل */}
      <div>
        <h2>رده‌بندی کاربران</h2>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
          🔄 به روزرسانی خودکار هر 10 ثانیه - مرتب شده بر اساس امتیاز
        </div>
        {users.length === 0 ? (
          <p>هنوز کاربری ثبت‌نام نکرده است</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {users
              .sort((a, b) => (b.total_crossword_score || 0) - (a.total_crossword_score || 0))
              .map((user, index) => (
                <div key={user.id} style={{ 
                  padding: '15px', 
                  border: '1px solid #ddd', 
                  borderRadius: '8px',
                  backgroundColor: currentUser && user.id === currentUser.id ? '#e3f2fd' : '#f9f9f9',
                  borderLeft: currentUser && user.id === currentUser.id ? '4px solid #0070f3' : '1px solid #ddd'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        backgroundColor: index === 0 ? '#FFD700' : 
                                       index === 1 ? '#C0C0C0' : 
                                       index === 2 ? '#CD7F32' : '#0070f3',
                        color: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        {index + 1}
                      </div>
                      <div>
                        <strong>{user.username}</strong> - {user.first_name} {user.last_name}
                        {currentUser && user.id === currentUser.id && <span style={{color: 'green', marginRight: '10px'}}> (شما)</span>}
                        <br />
                        📧 {user.email}
                        <br />
                        🎮 بازی‌ها: {user.crossword_games_played || 0}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0070f3' }}>
                        🎯 {user.total_crossword_score || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        ⏰ {new Date(user.registration_date).toLocaleDateString('fa-IR')}
                      </div>
                      {index === 0 && <div style={{ fontSize: '12px', color: '#FFD700' }}>🥇 طلایی</div>}
                      {index === 1 && <div style={{ fontSize: '12px', color: '#C0C0C0' }}>🥈 نقره‌ای</div>}
                      {index === 2 && <div style={{ fontSize: '12px', color: '#CD7F32' }}>🥉 برنزی</div>}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}