'use client';
import { useState, useEffect } from 'react';
import ProgressChart from '../components/ProgressChart';
import GameHistory from '../components/GameHistory'; // این خط رو اضافه کنید
import { dailyPuzzleData } from '../lib/dailyPuzzleData';

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
  const [dailyPuzzle, setDailyPuzzle] = useState(dailyPuzzleData);
 const [showLoginForm, setShowLoginForm] = useState(false);
const [loginData, setLoginData] = useState({
  email: '',
  password: ''
});
const [showAuthModal, setShowAuthModal] = useState(false);
  // وقتی صفحه لود شد - بررسی session کاربر
 // وقتی صفحه لود شد - بررسی session کاربر
// این useEffect رو پیدا کن و با این جایگزین کن:
useEffect(() => {
  const initializeApp = async () => {
    console.log('🚀 Initializing application...');
    
    // اول session رو بازیابی کن
    const sessionRestored = await restoreSession();
    
    if (!sessionRestored) {
      // اگر session نداره، بازی جدید شروع کن
      initializeGame();
    }
    
    // لیست کاربران رو بگیر
    await fetchUsers();
    
    console.log('✅ App initialization completed');
  };

  initializeApp();
  
  const interval = setInterval(fetchUsers, 10000);
  return () => clearInterval(interval);
}, []); // dependency خالی


  // تابع جدید برای بازیابی session بعد از رفرش
const restoreSession = async () => {
  try {
    console.log('🔄 Restoring session after page refresh...');
    
    const response = await fetch('/api/auth/session', {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (response.ok) {
      const sessionData = await response.json();
      console.log('📦 Session restore response:', sessionData);
      
      if (sessionData.user) {
        console.log('✅ Session restored successfully:', sessionData.user.id);
        setCurrentUser(sessionData.user);
        
        // آپدیت زمان ورود
        await updateLoginTime(sessionData.user.id);
        
        // لود اطلاعات کاربر و بازی
        await fetchUserStats(sessionData.user.id);
        await loadUserGameState(sessionData.user.id);
        
        return true;
      } else {
        console.log('❌ No active session found after refresh');
        
        // همیشه وقتی session نیست، کاربر رو null کن و بازی رو ریست کن
        setCurrentUser(null);
        initializeGame();
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Error restoring session:', error);
    
    // در صورت خطا هم کاربر رو null کن و بازی رو ریست کن
    setCurrentUser(null);
    initializeGame();
    return false;
  }
};

 

  // مقداردهی اولیه بازی
 // مقداردهی اولیه بازی
const initializeGame = () => {
  const size = dailyPuzzleData.size;
  console.log('🎯 Initializing game with size:', size);
  
  // ایجاد آرایه‌های ایمن
  setUserInput(Array(size).fill().map(() => Array(size).fill('')));
  setCellStatus(Array(size).fill().map(() => Array(size).fill('empty')));
  setDailyPuzzle(dailyPuzzleData);
  
  console.log('✅ Game initialized');
};

  // لود وضعیت بازی کاربر از سرور
  // لود وضعیت بازی کاربر از سرور
// لود وضعیت بازی کاربر از سرور
const loadUserGameState = async (userId) => {
  try {
    console.log('🔄 Loading game state for user:', userId);
    
    const response = await fetch(`/api/game/state?userId=${userId}`);
    
    if (response.ok) {
      const gameState = await response.json();
      console.log('📦 Game state response:', gameState);
      
      if (gameState && gameState.userProgress) {
        console.log('✅ Setting game state from server');
        
        // مقداردهی ایمن آرایه‌ها
        const size = dailyPuzzleData.size;
        
        // ایجاد آرایه‌های پیش‌فرض
        const defaultUserInput = Array(size).fill().map(() => Array(size).fill(''));
        const defaultCellStatus = Array(size).fill().map(() => Array(size).fill('empty'));
        
        // استفاده از داده‌های سرور یا مقادیر پیش‌فرض
        setUserInput(gameState.userProgress.userInput || defaultUserInput);
        setCellStatus(gameState.userProgress.cellStatus || defaultCellStatus);
        setScore(gameState.score || 0);
        setMistakes(gameState.mistakes || 0);
        setSelectedCell(gameState.userProgress.selectedCell || [0, 0]);
        setGameCompleted(gameState.completed || false);
        setCurrentGameId(gameState.id);
        
        console.log('🎮 Game state loaded successfully');
        console.log('📊 UserInput length:', (gameState.userProgress.userInput || defaultUserInput).length);
        console.log('📊 CellStatus length:', (gameState.userProgress.cellStatus || defaultCellStatus).length);
      } else {
        console.log('🆕 No active game found, starting new game');
        // اگر بازی فعالی نداره، بازی جدید شروع کن
        startNewGame(userId);
      }
    } else {
      console.error('❌ Error loading game state:', response.status);
    }
  } catch (error) {
    console.error('❌ Error loading game state:', error);
  }
};

  const fetchUserStats = async (userId) => {
  try {
    console.log('🔄 Fetching user stats for:', userId);
    
    const response = await fetch('/api/users');
    if (response.ok) {
      const userData = await response.json();
      const currentUserData = userData.find(user => user.id === userId);
      
      if (currentUserData) {
        console.log('📊 User stats loaded:', {
          id: currentUserData.id,
          total: currentUserData.total_crossword_score,
          today: currentUserData.today_crossword_score,
          games: currentUserData.crossword_games_played
        });
        
        setCurrentUser(currentUserData);
      } else {
        console.log('❌ User not found in user list');
      }
    } else {
      console.error('❌ Error fetching users:', response.status);
    }
  } catch (error) {
    console.error('❌ Error:', error);
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
    console.log('🎮 startNewGame called with userId:', userId);
    
    const response = await fetch('/api/game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'start',
        userId: userId,
        gameData: { puzzle: dailyPuzzleData }
      }),
    });

    console.log('🎮 Game API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Game started successfully:', data);
      
      setCurrentGameId(data.game.id);
      setScore(0);
      setMistakes(0);
      
      const size = dailyPuzzleData.size;
      setUserInput(Array(size).fill().map(() => Array(size).fill('')));
      setCellStatus(Array(size).fill().map(() => Array(size).fill('empty')));
      setSelectedCell([0, 0]);
      setGameCompleted(false);
      
      console.log('✅ Game state reset completed');
    } else {
      const errorData = await response.json();
      console.error('❌ Game API error:', errorData);
    }
  } catch (error) {
    console.error('❌ Error starting game:', error);
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
    console.log('🔵 1. Starting registration...');
    
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(formData),
    });

    console.log('🔵 2. Registration response status:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ 3. Registration successful:', result);
      
      setCurrentUser(result.user);
      console.log('🔵 4. Current user set:', result.user.id);
      
      setFormData({
        username: '', email: '', password: '',
        firstName: '', lastName: '', bankCardNumber: ''
      });
      
      await fetchUsers();
      console.log('🔵 5. Users fetched');
      
      // شروع بازی جدید - بدون setTimeout
      console.log('🔵 6. Calling startNewGame...');
      await startNewGame(result.user.id);
      console.log('🔵 7. startNewGame completed');
      
    } else {
      const errorData = await response.json();
      console.error('❌ Registration failed:', errorData);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    setLoading(false);
    console.log('🔵 8. Loading set to false');
  }
};

  const handleLogout = async () => {
  try {
    // اگر کاربر مهمان هست
    if (currentUser && currentUser.id === 'guest') {
      console.log('🎮 Logging out guest user');
      setCurrentUser(null);
      initializeGame(); // بازی رو ریست کن
      return;
    }
    
    // اگر کاربر ثبت‌نام شده هست
    if (currentUser) {
      // آپدیت زمان خروج
      await updateLogoutTime(currentUser.id);
    }
    
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    setCurrentUser(null);
    initializeGame();
    await fetchUsers();
    
    console.log('✅ User logged out successfully');
  } catch (error) {
    console.error('❌ Error logging out:', error);
  }
};

// آپدیت زمان ورود در دیتابیس
const updateLoginTime = async (userId) => {
  try {
    await fetch('/api/users/update-login-time', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    console.log('✅ Login time updated');
  } catch (error) {
    console.error('❌ Error updating login time:', error);
  }
};

// آپدیت زمان خروج در دیتابیس
const updateLogoutTime = async (userId) => {
  try {
    await fetch('/api/users/update-logout-time', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    console.log('✅ Logout time updated');
  } catch (error) {
    console.error('❌ Error updating logout time:', error);
  }
};

const handleInputChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  });
};


  // انتخاب خانه - فقط خانه‌های قفل نشده قابل انتخاب هستند
  const handleCellSelect = (row, col) => {
    if (dailyPuzzleData.grid[row][col] === 1 && cellStatus[row][col] !== 'locked' && !gameCompleted) {
      setSelectedCell([row, col]);
    }
  };

  // تابع جدید برای ذخیره وضعیت بازی در سرور
  const saveGameStateToServer = async (input, status, currentScore, currentMistakes) => {
    try {
      await fetch('/api/game/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: currentGameId,
          userProgress: {
            userInput: input,
            cellStatus: status,
            selectedCell: selectedCell
          },
          score: currentScore,
          mistakes: currentMistakes
        }),
      });
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  };

  // ورود حرف
  const handleInput = async (char) => {
    if (gameCompleted || !currentUser || !currentGameId) return;

    const [row, col] = selectedCell;
    
    // اگر خانه قبلاً قفل شده باشد، کاری نکن
    if (cellStatus[row][col] === 'locked') return;

    const newInput = [...userInput];
    newInput[row][col] = char;
    setUserInput(newInput);

    // بررسی پاسخ
    const isCorrect = char === dailyPuzzleData.solution[row][col];
    const newCellStatus = [...cellStatus];

    let scoreToAdd = 0;

    if (isCorrect) {
      // خانه رو قفل کن
      newCellStatus[row][col] = 'locked';
      scoreToAdd = 3; // 3 امتیاز برای پاسخ درست
      const newScore = score + scoreToAdd;
      setScore(newScore);
    } else {
      newCellStatus[row][col] = 'wrong';
      scoreToAdd = -3; // همیشه 3 امتیاز کسر برای هر اشتباه
      const newScore = score + scoreToAdd;
      setScore(newScore);
      setMistakes(mistakes + 1);
    }

    setCellStatus(newCellStatus);

    // ذخیره وضعیت بازی در سرور
    await saveGameStateToServer(newInput, newCellStatus, score + scoreToAdd, mistakes + (isCorrect ? 0 : 1));

    // ذخیره امتیاز در دیتابیس فقط اگر امتیاز تغییر کرده
    if (scoreToAdd !== 0) {
      await updateUserScoreInDB(currentUser.id, scoreToAdd);
    }

    // حرکت به خانه بعدی (فقط اگر خانه قفل نشده باشد)
    if (!isCorrect) {
      moveToNextCell(row, col);
    } else {
      // اگر خانه قفل شد، اولین خانه قفل نشده بعدی رو پیدا کن
      findNextUnlockedCell();
    }
  };

  // پیدا کردن اولین خانه قفل نشده بعدی
  const findNextUnlockedCell = () => {
    for (let i = 0; i < dailyPuzzleData.size; i++) {
      for (let j = 0; j < dailyPuzzleData.size; j++) {
        if (dailyPuzzleData.grid[i][j] === 1 && cellStatus[i][j] !== 'locked') {
          setSelectedCell([i, j]);
          return;
        }
      }
    }
    // اگر همه خانه‌ها قفل شدند، بازی کامل شده
    checkGameCompletion();
  };

  // حرکت به خانه بعدی
  const moveToNextCell = (row, col) => {
    let nextRow = row;
    let nextCol = col + 1;

    if (nextCol >= dailyPuzzleData.size) {
      nextRow++;
      nextCol = 0;
    }

    if (nextRow < dailyPuzzleData.size) {
      // پیدا کردن خانه سفید و قفل نشده بعدی
      while (nextRow < dailyPuzzleData.size && 
             (dailyPuzzleData.grid[nextRow][nextCol] === 0 || cellStatus[nextRow][nextCol] === 'locked')) {
      nextCol++;
        if (nextCol >= dailyPuzzleData.size) {
          nextRow++;
          nextCol = 0;
        }
         if (nextRow >= dailyPuzzleData.size) break;
      }
      
      if (nextRow < dailyPuzzleData.size) {
        setSelectedCell([nextRow, nextCol]);
      }
    }

    checkGameCompletion();
  };

  // بررسی تکمیل بازی - همه خانه‌ها باید قفل شده باشند
const checkGameCompletion = async () => {
  let allLocked = true;
  
  for (let i = 0; i < dailyPuzzleData.size; i++) {
    for (let j = 0; j < dailyPuzzleData.size; j++) {
      if (dailyPuzzleData.grid[i][j] === 1 && cellStatus[i][j] !== 'locked') {
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
    
    // تکمیل بازی در سرور
    try {
      await fetch('/api/game/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: currentGameId,
          finalScore: finalScore
        }),
      });

      // ذخیره در تاریخچه بازی‌ها
      await saveGameToHistory(currentUser.id, currentGameId, finalScore, mistakes);
      
    } catch (error) {
      console.error('Error completing game:', error);
    }
    
    // ذخیره پاداش تکمیل بازی در دیتابیس
    await updateUserScoreInDB(currentUser.id, 50);
  }
};


// تابع جدید برای ذخیره بازی در تاریخچه
const saveGameToHistory = async (userId, gameId, finalScore, mistakeCount) => {
  try {
    await fetch('/api/game/save-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        gameId: gameId,
        puzzleData: dailyPuzzleData,
        score: finalScore,
        mistakes: mistakeCount
      }),
    });
    console.log('✅ Game saved to history');
  } catch (error) {
    console.error('Error saving game history:', error);
  }
};

// تابع handleLogin برای ورود کاربران موجود
const handleLogin = async (email, password) => {
  setLoading(true);
  
  try {
    console.log('🔐 Attempting login...');
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Login successful:', result);
      
      setCurrentUser(result.user);
      setLoginData({ email: '', password: '' });
      
      await fetchUsers();
      await startNewGame(result.user.id);
      
    } else {
      const errorData = await response.json();
      console.error('❌ Login failed:', errorData);
      alert(errorData.error || 'خطا در ورود');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('خطا در ارتباط با سرور');
  } finally {
    setLoading(false);
  }
};


  // صفحه کلید فارسی
  const persianKeyboard = [
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'چ'],
    ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک', 'گ'],
    ['ظ', 'ط', 'ز', 'ر', 'ذ', 'د', 'پ', 'و', 'ئ']
  ];

  // استفاده از dailyPuzzleData به عنوان منبع اصلی
  const puzzle = dailyPuzzleData;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
     {/* هدر زیبا با منوی کاربر */}
<header style={{
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '15px 20px',
  borderRadius: '15px',
  marginBottom: '30px',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  color: 'white'
}}>
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto'
  }}>
    {/* عنوان بازی */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <div style={{
        fontSize: '28px',
        fontWeight: 'bold'
      }}>
        🧩 کراسورد
      </div>
      <div style={{
        fontSize: '14px',
        opacity: '0.9'
      }}>
        {puzzle.title}
      </div>
    </div>

    {/* منوی کاربر */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      {currentUser ? (
        /* کاربر لاگین کرده */
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              👋 سلام {currentUser.first_name}!
            </div>
            <div style={{ fontSize: '12px', opacity: '0.9' }}>
              🎯 امتیاز: {currentUser.total_crossword_score || 0}
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
            }}
          >
            🚪 خروج
          </button>
        </div>
      ) : (
   /* کاربر لاگین نکرده */
<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
  {/* دکمه جدید: بازی به عنوان مهمان */}
 <button 
  onClick={() => {
    // حالت مهمان - بدون ثبت‌نام بازی کن
    setCurrentUser({
      id: 'guest',
      username: 'مهمان',
      first_name: 'کاربر',
      last_name: 'مهمان',
      email: 'guest@example.com',
      total_crossword_score: 0,
      today_crossword_score: 0,
      crossword_games_played: 0,
      crossword_rank: 0
    });
    setShowAuthModal(false);
    initializeGame();
  }}
>
  🎮 مهمان
</button>
  
  {/* دکمه‌های قبلی (ورود و ثبت‌نام) */}
  <button 
    onClick={() => {
      setShowAuthModal(true);
      setShowLoginForm(true);
    }}
    style={{
      padding: '8px 16px',
      backgroundColor: 'rgba(255,255,255,0.2)',
      color: 'white',
      border: '1px solid rgba(255,255,255,0.3)',
      borderRadius: '25px',
      cursor: 'pointer',
      fontSize: '14px'
    }}
  >
    🔐 ورود
  </button>
  
  <button 
    onClick={() => {
      setShowAuthModal(true);
      setShowLoginForm(false);
    }}
    style={{
      padding: '8px 16px',
      backgroundColor: 'white',
      color: '#667eea',
      border: 'none',
      borderRadius: '25px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold'
    }}
  >
    📝 ثبت‌نام
  </button>
</div>
      )}
    </div>
  </div>
</header>

{/* مودال فرم‌های ورود و ثبت‌نام */}
{!currentUser && showAuthModal && (
  <div style={{
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    zIndex: 1000,
    minWidth: '400px',
    maxWidth: '90vw'
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      borderBottom: '2px solid #f0f0f0',
      paddingBottom: '15px'
    }}>
      <h2 style={{ margin: 0, color: '#333' }}>
        {showLoginForm ? '🔐 ورود به حساب' : '📝 ثبت‌نام جدید'}
      </h2>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setShowLoginForm(false)}
          style={{
            padding: '5px 15px',
            backgroundColor: showLoginForm ? '#f0f0f0' : '#667eea',
            color: showLoginForm ? '#666' : 'white',
            border: 'none',
            borderRadius: '15px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          ثبت‌نام
        </button>
        <button 
          onClick={() => setShowLoginForm(true)}
          style={{
            padding: '5px 15px',
            backgroundColor: showLoginForm ? '#667eea' : '#f0f0f0',
            color: showLoginForm ? 'white' : '#666',
            border: 'none',
            borderRadius: '15px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          ورود
        </button>
      </div>
    </div>

    {showLoginForm ? (
      /* فرم ورود */
      <form onSubmit={(e) => {
        e.preventDefault();
        // تابع handleLogin رو بعداً اضافه می‌کنیم
        handleLogin(loginData.email, loginData.password);
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              ایمیل:
            </label>
            <input 
              type="email" 
              value={loginData.email}
              onChange={(e) => setLoginData({...loginData, email: e.target.value})}
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ddd', 
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              رمز عبور:
            </label>
            <input 
              type="password" 
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ddd', 
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <button
            type="submit"
            style={{ 
              padding: '12px', 
              backgroundColor: '#667eea', 
              color: 'white', 
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              marginTop: '10px'
            }}
          >
            ورود به حساب
          </button>
        </div>
      </form>
    ) : (
      /* فرم ثبت‌نام */
      <form onSubmit={handleRegister}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
              نام کاربری:
            </label>
            <input 
              type="text" 
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
              ایمیل:
            </label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
              رمز عبور:
            </label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
              نام:
            </label>
            <input 
              type="text" 
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
              نام خانوادگی:
            </label>
            <input 
              type="text" 
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
              شماره کارت (اختیاری):
            </label>
            <input 
              type="text" 
              name="bankCardNumber"
              value={formData.bankCardNumber}
              onChange={handleInputChange}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
          </div>
        </div>
        
        <button
          type="submit"
          style={{ 
            width: '100%',
            padding: '12px', 
            backgroundColor: loading ? '#ccc' : '#667eea', 
            color: 'white', 
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'default' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            marginTop: '20px'
          }}
          disabled={loading}
        >
          {loading ? '⏳ در حال ثبت...' : '✅ ثبت‌نام و ورود'}
        </button>
      </form>
    )}
  </div>
)}

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
           
{currentUser && (
  <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
    <GameHistory userId={currentUser.id} />
  </div>
)}
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
            تاریخ: {dailyPuzzle.date}
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
                  {userInput[rowIndex] && userInput[rowIndex][colIndex] !== undefined ? userInput[rowIndex][colIndex] : ''}
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