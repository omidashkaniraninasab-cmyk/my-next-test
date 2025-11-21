'use client';


import { useState, useEffect, useRef } from 'react';
import { getSessionFromCookie, logout } from '@/lib/client-auth';
import ProgressChart from '../components/ProgressChart';
import GameHistory from '../components/GameHistory';
import DailyChallenge from '@/components/games/DailyChallenge';
import MemoryGame from '@/components/games/MemoryGame/MemoryGame';

const LEVEL_SYSTEM = {
  1: { xpRequired: 0, title: "تازه‌کار" },
  2: { xpRequired: 100, title: "مبتدی" },
  3: { xpRequired: 300, title: "علاقه‌مند" },
  4: { xpRequired: 600, title: "منظم" },
  5: { xpRequired: 1000, title: "حرفه‌ای" },
  6: { xpRequired: 1500, title: "ماهر" },
  7: { xpRequired: 2100, title: "استاد" },
  8: { xpRequired: 2800, title: "ارشد" },
  9: { xpRequired: 3600, title: "خبره" },
  10: { xpRequired: 4500, title: "اسطوره" },
  11: { xpRequired: 5500, title: "افسانه" },
  12: { xpRequired: 6600, title: "قهرمان" },
  13: { xpRequired: 7800, title: "نابغه" },
  14: { xpRequired: 9100, title: "شاهکار" },
  15: { xpRequired: 10500, title: "بی‌نظیر" }
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
  const [userInput, setUserInput] = useState([]);
  const [cellStatus, setCellStatus] = useState([]);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [selectedCell, setSelectedCell] = useState([0, 0]);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [currentGameId, setCurrentGameId] = useState(null);
  const [dailyPuzzle, setDailyPuzzle] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [puzzleLoading, setPuzzleLoading] = useState(true);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [todayGameCompleted, setTodayGameCompleted] = useState(false);
  const [instantScore, setInstantScore] = useState(0);
  const [firstInputSent, setFirstInputSent] = useState(false);
  const [userLevel, setUserLevel] = useState({ level: 1, xp: 0, title: 'تازه‌کار' });
  const [dailyPerformance, setDailyPerformance] = useState({
  accuracy: 0,
  errorRate: 0, 
  dailyLevel: 0,
  totalCells: 0,
  correctCells: 0,
  wrongCells: 0,
  totalMistakes: 0,
  uniqueWrongCells: 0
});
const [mistakeHistory, setMistakeHistory] = useState({});
const [currentTimeStatus, setCurrentTimeStatus] = useState('open'); // 'open', 'closed', 'just-opened'
const [gameHistoryKey, setGameHistoryKey] = useState(0);

  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Initializing application...');
      
      // ✅ اول - restore session از کوکی
      const sessionRestored = await restoreSession();
      
      if (!sessionRestored) {
        console.log('🎮 Auto-login as guest');
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
      }
      
      await fetchUsers();
      console.log('✅ App initialization completed');
    };

    initializeApp();
    
    const interval = setInterval(fetchUsers, 120000);
    return () => clearInterval(interval);
  }, []);

// در useEffect یا وقتی بازی آپدیت می‌شه
useEffect(() => {
  const performance = calculateDailyPerformance();
  setDailyPerformance(performance);
}, [cellStatus, dailyPuzzle]);
// تابع برای گرفتن اطلاعات سطح
const fetchUserLevel = async (userId) => {
  try {
    const response = await fetch(`/api/user/level?userId=${userId}`);
    if (response.ok) {
      const data = await response.json();
      setUserLevel(data.level);
    }
  } catch (error) {
    console.error('Error fetching user level:', error);
  }
};

// فراخوانی در useEffect وقتی کاربر لاگین می‌کنه
useEffect(() => {
  if (currentUser) {
    fetchUserLevel(currentUser.id);
  }
}, [currentUser]);

// 🆕 رفرش خودکار وضعیت کاربر هر 2 دقیقه
// 🆕 **رفرش وضعیت کاربر فقط وقتی لازم است**
useEffect(() => {
  if (!currentUser || currentUser.id === 'guest') return;
  
  const refreshUserStatus = async () => {
    await checkGameStatus(currentUser.id);
    await fetchUserStats(currentUser.id);
  };
  
  // فقط هر 5 دقیقه یکبار رفرش کن
  const interval = setInterval(refreshUserStatus, 300000);
  return () => clearInterval(interval);
}, [currentUser]);




 const restoreSession = async () => {
  try {
    console.log('🔄 Restoring session after page refresh...');
    
    const user = await getSessionFromCookie();
    
    if (user) {
      console.log('✅ Session restored successfully:', user.id);
      setCurrentUser(user);
      
      await updateLoginTime(user.id);
      await fetchUserStats(user.id);
      await checkGameStatus(user.id); // 🆕 حالا درسته
      await loadUserGameState(user.id);
      await loadDailyPuzzle();
      
      return true;
    } else {
      console.log('❌ No active session found after refresh');
      setCurrentUser(null);
      await loadDailyPuzzle();
      return false;
    }
  } catch (error) {
    console.error('❌ Error restoring session:', error);
    setCurrentUser(null);
    await loadDailyPuzzle();
    return false;
  }
};


  

const loadDailyPuzzle = async () => {
  try {
    setPuzzleLoading(true);
    console.log('🎯 Loading daily puzzle...');
    
    // اول از monthly-puzzles سعی کن
    const monthlyResponse = await fetch('/api/monthly-puzzles');
    
    if (monthlyResponse.ok) {
      const monthlyData = await monthlyResponse.json();
      console.log('✅ Monthly puzzle loaded:', monthlyData.date);
      setDailyPuzzle(monthlyData.puzzle_data);
    } else if (monthlyResponse.status === 404) {
      // اگر پیدا نکرد، از سیستم قدیمی استفاده کن
      console.log('📅 No monthly puzzle, using legacy system...');
      const legacyResponse = await fetch('/api/daily-puzzle');
      
      if (legacyResponse.ok) {
        const legacyData = await legacyResponse.json();
        setDailyPuzzle(legacyData);
      } else {
        throw new Error('Failed to load puzzle');
      }
    } else {
      throw new Error('Monthly puzzles API error');
    }
    
  } catch (error) {
    console.error('💥 Error loading puzzle:', error);
    // Fallback به داده‌های محلی
    const puzzleModule = await import('@/lib/dailyPuzzleData');
    setDailyPuzzle(puzzleModule.dailyPuzzleData);
  } finally {
    setPuzzleLoading(false);
  }
};

  const initializeGame = () => {
    if (!dailyPuzzle) {
      console.log('⏳ Waiting for puzzle to load...');
      return;
    }
    
    const size = dailyPuzzle.size;
    console.log('🎯 Initializing game with size:', size);
    
    setUserInput(Array(size).fill().map(() => Array(size).fill('')));
    setCellStatus(Array(size).fill().map(() => Array(size).fill('empty')));
    
    console.log('✅ Game initialized');
  };

  const loadUserGameState = async (userId) => {
    try {
      console.log('🔄 Loading game state for user:', userId);
      
      const response = await fetch(`/api/game/state?userId=${userId}`);
      
      if (response.ok) {
        const gameState = await response.json();
        console.log('📦 Game state response:', gameState);
        
        if (gameState && gameState.userProgress) {
          console.log('✅ Setting game state from server');
          
          const size = dailyPuzzle ? dailyPuzzle.size : 6;
          
          const defaultUserInput = Array(size).fill().map(() => Array(size).fill(''));
          const defaultCellStatus = Array(size).fill().map(() => Array(size).fill('empty'));
          
          setUserInput(gameState.userProgress.userInput || defaultUserInput);
          setCellStatus(gameState.userProgress.cellStatus || defaultCellStatus);
          setScore(gameState.score || 0);
          setMistakes(gameState.mistakes || 0);
          setSelectedCell(gameState.userProgress.selectedCell || [0, 0]);
          setGameCompleted(gameState.completed || false);
          setCurrentGameId(gameState.id);
          
          console.log('🎮 Game state loaded successfully');
        } else {
          console.log('🆕 No active game found, starting new game');
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
        
        // 🆕 **فقط اگر داده واقعاً تغییر کرده باشه، state رو آپدیت کن**
        setCurrentUser(prevUser => {
          if (prevUser && 
              prevUser.total_crossword_score === currentUserData.total_crossword_score &&
              prevUser.today_crossword_score === currentUserData.today_crossword_score) {
            console.log('🔄 No changes in user stats, skipping update');
            return prevUser;
          }
          console.log('✅ User stats updated');
          return currentUserData;
        });
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
        gameData: { puzzle: dailyPuzzle }
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Game started successfully:', data);
      
      setCurrentGameId(data.game.id);
      setScore(0);
      setMistakes(0);
      setInstantScore(0);
      
      // 🆕 **تغییر این خط - اضافه کردن پارامتر resetTodayScore**
      await updateUserScoreInDB(userId, 0, 0, true);
      
      const size = dailyPuzzle ? dailyPuzzle.size : 6;
      setUserInput(Array(size).fill().map(() => Array(size).fill('')));
      setCellStatus(Array(size).fill().map(() => Array(size).fill('empty')));
      setSelectedCell([0, 0]);
      setGameCompleted(false);
      
      console.log('✅ Game state reset completed');
    }
  } catch (error) {
    console.error('❌ Error starting game:', error);
  }
};

 // تابع آپدیت امتیاز در دیتابیس - اصلاح شده
const updateUserScoreInDB = async (userId, additionalScore, currentInstantScore, resetTodayScore = false) => {
  try {
    const response = await fetch('/api/users/update-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        additionalScore: additionalScore,
        currentInstantScore: currentInstantScore,
        resetTodayScore: resetTodayScore // 🆕 اضافه کردن این پارامتر
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
        await checkGameStatus(result.user.id);
        setFormData({
          username: '', email: '', password: '',
          firstName: '', lastName: '', bankCardNumber: ''
        });
        
        await fetchUsers();
        console.log('🔵 5. Users fetched');
        
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
      if (currentUser && currentUser.id === 'guest') {
        console.log('🎮 Logging out guest user');
        setCurrentUser(null);
        initializeGame();
        return;
      }
      
      if (currentUser) {
        await updateLogoutTime(currentUser.id);
      }
      
      await logout();
      
      setCurrentUser(null);
      initializeGame();
      await fetchUsers();
      
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Error logging out:', error);
    }
  };

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



  const handleCellSelect = (row, col) => {
    if (dailyPuzzle && dailyPuzzle.grid[row][col] === 1 && cellStatus[row][col] !== 'locked' && !gameCompleted) {
      setSelectedCell([row, col]);
    }
  };

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
          mistakes: currentMistakes,
           userId: currentUser?.id  // 🆕 اضافه کردن userId
        }),
      });
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  };

// تابع handleInput - اصلاح شده
const handleInput = async (char) => {
  console.log('🎮 handleInput called with char:', char);

  if (gameCompleted || !currentUser || !currentGameId || !dailyPuzzle) {
    console.log('❌ Blocked by conditions - Game completed:', gameCompleted);
    return;
  }

  const [row, col] = selectedCell;
  
  if (cellStatus[row]?.[col] === 'locked') {
    console.log('❌ Cell is locked');
    return;
  }

  if (!firstInputSent) {
    console.log('🚀 Sending first-input request...');
    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'first-input',
          userId: currentUser.id,
          gameId: currentGameId
        })
      });
      
      if (response.ok) {
        setFirstInputSent(true);
      }
    } catch (error) {
      console.error('❌ Error recording first input:', error);
    }
  }

  const newInput = [...userInput];
  newInput[row][col] = char;
  setUserInput(newInput);

  const isCorrect = char === dailyPuzzle.solution[row][col];
  const newCellStatus = [...cellStatus];

  let scoreToAdd = 0;

  if (isCorrect) {
    newCellStatus[row][col] = 'locked';
    scoreToAdd = 3;
    
    try {
      await fetch('/api/user/level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          xp: 10,
          reason: 'پر کردن خانه کراسورد'
        })
      });
      await fetchUserLevel(currentUser.id);
    } catch (error) {
      console.error('❌ Error adding XP:', error);
    }
    
  } else {
    newCellStatus[row][col] = 'wrong';
    scoreToAdd = -3;
    setMistakes(mistakes + 1);
    
    const cellKey = `${row}-${col}`;
    setMistakeHistory(prev => ({
      ...prev,
      [cellKey]: (prev[cellKey] || 0) + 1
    }));
  }

  const newInstantScore = instantScore + scoreToAdd;
  const newTotalScore = score + scoreToAdd;
  
  setInstantScore(newInstantScore);
  setScore(newTotalScore);

  try {
    await updateUserScoreInDB(currentUser.id, scoreToAdd, newInstantScore);
    console.log('✅ Score updated in database:', scoreToAdd);
  } catch (error) {
    console.error('❌ Error updating score:', error);
  }

  setCellStatus(newCellStatus);

  const updatedPerformance = calculateDailyPerformance();
  setDailyPerformance(updatedPerformance);

  await saveGameStateToServer(newInput, newCellStatus, newTotalScore, mistakes + (isCorrect ? 0 : 1));

  if (!isCorrect) {
    moveToNextCell(row, col);
  } else {
    findNextUnlockedCell();
  }

  if (!gameCompleted && !completionCheckedRef.current) {
    console.log('🔍 Checking game completion after input...');
    checkGameCompletion();
  }
};

  const findNextUnlockedCell = () => {
    if (!dailyPuzzle) return;
    
    for (let i = 0; i < dailyPuzzle.size; i++) {
      for (let j = 0; j < dailyPuzzle.size; j++) {
        if (dailyPuzzle.grid[i][j] === 1 && cellStatus[i][j] !== 'locked') {
          setSelectedCell([i, j]);
          return;
        }
      }
    }
    checkGameCompletion();
  };

  const moveToNextCell = (row, col) => {
    if (!dailyPuzzle) return;
    
    let nextRow = row;
    let nextCol = col + 1;

    if (nextCol >= dailyPuzzle.size) {
      nextRow++;
      nextCol = 0;
    }

    if (nextRow < dailyPuzzle.size) {
      while (nextRow < dailyPuzzle.size && 
             (dailyPuzzle.grid[nextRow][nextCol] === 0 || cellStatus[nextRow][nextCol] === 'locked')) {
        nextCol++;
        if (nextCol >= dailyPuzzle.size) {
          nextRow++;
          nextCol = 0;
        }
        if (nextRow >= dailyPuzzle.size) break;
      }
      
      if (nextRow < dailyPuzzle.size) {
        setSelectedCell([nextRow, nextCol]);
      }
    }

    checkGameCompletion();
  };
const completionCheckedRef = useRef(false);
// تابع checkGameCompletion - اصلاح شده
// تابع checkGameCompletion - اصلاح شده
// تابع checkGameCompletion - اصلاح شده با useRef
// تابع checkGameCompletion - اصلاح شده با محاسبه صحیح امتیاز
// تابع checkGameCompletion - اصلاح شده با محاسبه صحیح امتیاز
// تابع checkGameCompletion - اصلاح شده با ترتیب صحیح
// تابع checkGameCompletion - اصلاح شده با روش ساده
// تابع checkGameCompletion - کامل شده با آپدیت last_game_date
const checkGameCompletion = async () => {
  if (!dailyPuzzle || gameCompleted || completionCheckedRef.current) {
    console.log('❌ Game completion check skipped:', {
      hasPuzzle: !!dailyPuzzle,
      gameCompleted,
      alreadyChecked: completionCheckedRef.current
    });
    return;
  }
  
  let allLocked = true;
  
  for (let i = 0; i < dailyPuzzle.size; i++) {
    for (let j = 0; j < dailyPuzzle.size; j++) {
      if (dailyPuzzle.grid[i][j] === 1 && cellStatus[i]?.[j] !== 'locked') {
        allLocked = false;
        break;
      }
    }
    if (!allLocked) break;
  }

  if (allLocked) {
    console.log('🎯 Game completed! Setting completion state...');
    
    completionCheckedRef.current = true;
    setGameCompleted(true);
    setTodayGameCompleted(true);
    setInstantScore(0);
    
    const bonusScore = 50;

    console.log('🔍 DEBUG - Adding bonus score:', {
      currentUser: currentUser?.id,
      currentTodayScore: currentUser?.today_crossword_score,
      bonusScore: bonusScore
    });

    try {
      console.log('💰 Adding bonus score to today score...');
      
      // 1. پاداش رو اضافه کن
      const scoreResponse = await fetch('/api/users/update-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          additionalScore: bonusScore,
          currentInstantScore: 0
        }),
      });

      if (!scoreResponse.ok) {
        const errorText = await scoreResponse.text();
        console.error('❌ Score update failed:', errorText);
        throw new Error('Failed to add bonus score');
      }

      console.log('✅ Bonus score added to today score');

      // 2. آپدیت وضعیت کاربر
      await fetchUserStats(currentUser.id);
      
      // 3. تکمیل بازی
      console.log('🏁 Marking game as completed...');
      const completeResponse = await fetch('/api/game/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: currentGameId,
          finalScore: currentUser.today_crossword_score + bonusScore,
          userId: currentUser.id
        }),
      });

      if (!completeResponse.ok) {
        console.warn('⚠️ Game complete API returned non-200 status:', completeResponse.status);
      } else {
        console.log('✅ Game marked as completed');
      }

      // 4. XP
      console.log('⭐ Adding XP for game completion...');
      try {
        const xpResponse = await fetch('/api/user/level', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            xp: 100,
            reason: 'اتمام بازی کراسورد'
          })
        });
        
        if (!xpResponse.ok) {
          console.warn('⚠️ XP API returned non-200 status:', xpResponse.status);
        } else {
          console.log('✅ XP added successfully');
        }
      } catch (xpError) {
        console.warn('⚠️ XP addition failed, but continuing:', xpError.message);
      }

      // 5. ذخیره تاریخچه - با هندلینگ خطا
      console.log('💾 Saving game to history...');
      
      try {
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const updatedUser = usersData.find(user => user.id === currentUser.id);
          
          if (updatedUser) {
            const finalTodayScore = updatedUser.today_crossword_score;
            
            console.log('🔍 Final today score from database:', finalTodayScore);
            
            const historyResponse = await fetch('/api/game/save-history', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: currentUser.id,
                gameId: currentGameId,
                puzzleData: dailyPuzzle,
                mistakes: mistakes,
                todayScore: finalTodayScore
              }),
            });

            if (historyResponse.ok) {
              console.log('✅ History saved with final score:', finalTodayScore);
            } else {
              console.warn('⚠️ History save returned non-200 status:', historyResponse.status);
              // تلاش برای گرفتن پیام خطا
              try {
                const errorData = await historyResponse.json();
                console.warn('⚠️ History save error details:', errorData);
              } catch (e) {
                console.warn('⚠️ Could not parse history error response');
              }
            }
          }
        } else {
          console.warn('⚠️ Could not fetch users for history');
        }
      } catch (historyError) {
        console.warn('⚠️ History save failed, but continuing:', historyError.message);
        // ادامه بده حتی اگر تاریخچه ذخیره نشد
      }

      // 6. آپدیت نهایی وضعیت
      await fetchUserStats(currentUser.id);
      await fetchUsers();
      setGameHistoryKey(prev => prev + 1);
      
      console.log('🎉 Game completion process finished!');

    } catch (error) {
      console.error('❌ Critical error in game completion process:', error);
      completionCheckedRef.current = false;
      
      // نمایش پیام به کاربر
      alert('خطایی در تکمیل بازی رخ داد. بازی تکمیل شده اما ممکن است برخی اطلاعات ذخیره نشده باشند.');
    }
  }
};

 const saveGameToHistory = async (userId, gameId, puzzleData, mistakes, todayScore) => {
  try {
    console.log('💾 Saving to history with score:', todayScore);
    
    const response = await fetch('/api/game/save-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        gameId: gameId,
        puzzleData: puzzleData,
        score: todayScore, // این باید امتیاز واقعی باشد
        mistakes: mistakes,
        date: new Date().toISOString()
      }),
    });

    if (response.ok) {
      console.log('✅ Game saved to history with score:', todayScore);
    } else {
      console.error('❌ Failed to save history:', response.status);
    }
  } catch (error) {
    console.error('❌ Error saving game history:', error);
  }
};

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
        setShowAuthModal(false);
        
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

 const checkGameStatus = async (userId) => {
  try {
    console.log('🔍 Checking game status for user:', userId);
    
    // 🆕 همیشه false برگردون تا کاربران بتونن بازی کنن
    console.log('✅ Game status set to: Not completed (temporary)');
    setTodayGameCompleted(false);
    
  } catch (error) {
    console.error('❌ Error checking game status:', error);
    setTodayGameCompleted(false);
  }
};


// تابع محاسبه عملکرد روزانه با درنظرگیری تاریخچه اشتباهات
const calculateDailyPerformance = () => {
  if (!dailyPuzzle) return { 
    accuracy: 0, 
    errorRate: 0, 
    dailyLevel: 0, 
    totalCells: 0, 
    correctCells: 0, 
    wrongCells: 0,
    totalMistakes: 0,
    uniqueWrongCells: 0
  };
  
  const totalCells = dailyPuzzle.grid.flat().filter(cell => cell === 1).length;
  const correctCells = cellStatus.flat().filter(status => status === 'locked').length;
  
  // خانه‌های currently wrong
  const currentWrongCells = cellStatus.flat().filter(status => status === 'wrong').length;
  
  // 🆕 کل اشتباهات (تعداد دفعات اشتباه)
  const totalMistakes = Object.values(mistakeHistory).reduce((sum, count) => sum + count, 0);
  
  // خانه‌های منحصر به فردی که کاربر در آنها اشتباه کرده
  const uniqueWrongCells = new Set([
    ...Object.keys(mistakeHistory),
    ...cellStatus.flatMap((row, rowIndex) => 
      row.map((cell, colIndex) => 
        cell === 'wrong' ? `${rowIndex}-${colIndex}` : null
      ).filter(Boolean)
    )
  ]).size;

  // 🆕 فرمول جدید دقت: (خانه‌های درست - کل اشتباهات) / کل خانه‌ها × ۱۰۰
  const accuracy = totalCells > 0 ? 
    Math.max(0, (correctCells - totalMistakes) / totalCells * 100) : 0;
  
  // درصد خطا براساس خانه‌های منحصر به فرد اشتباه
  const errorRate = totalCells > 0 ? (uniqueWrongCells / totalCells) * 100 : 0;
  
  const dailyLevel = Math.max(0, 100 - errorRate);
  
  return {
    accuracy: Math.round(accuracy),
    errorRate: Math.round(errorRate),
    dailyLevel: Math.round(dailyLevel),
    totalCells,
    correctCells,
    wrongCells: currentWrongCells,
    totalMistakes, // 🆕 اینجا فقط تعداد دفعات اشتباهه
    uniqueWrongCells
  };
};

// این رو قبل از return اصلی اضافه کن - مثلاً بعد از توابع دیگر
const renderCrosswordGrid = () => {
  console.log('🎨 renderCrosswordGrid called');
  
  if (!dailyPuzzle) {
    console.log('❌ No daily puzzle');
    return <div>❌ هیچ جدولی برای نمایش وجود ندارد</div>;
  }
  
  const size = dailyPuzzle.size;
  console.log('🔍 Grid details:', {
    size: size,
    userInputLength: userInput.length,
    cellStatusLength: cellStatus.length,
    hasGrid: !!dailyPuzzle.grid,
    gridSize: dailyPuzzle.grid?.length
  });

  // 🆕 تست ساده - اگر userInput خالی هست، یک جدول تستی نمایش بده
  if (userInput.length === 0 || cellStatus.length === 0) {
    console.log('⚠️ Using fallback grid');
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#ffeb3b', 
        color: '#333',
        textAlign: 'center',
        marginBottom: '20px',
        borderRadius: '8px',
        border: '2px solid #ffc107'
      }}>
        <h3>🧩 جدول تستی</h3>
        <p>این یک جدول تستی است - بازی initialize شده اما داده‌ها خالی هستند</p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${size}, 40px)`,
          gap: '2px',
          justifyContent: 'center',
          margin: '20px auto'
        }}>
          {Array.from({ length: size * size }, (_, index) => (
            <div
              key={index}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#e0e0e0',
                border: '1px solid #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {index % size}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const toPersianNumber = (number) => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return number.toString().replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
  };

  console.log('✅ Rendering actual crossword grid');
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      marginBottom: '20px',
      width: '100%',
      padding: '0 10px',
      boxSizing: 'border-box'
    }}>
      {/* بقیه کدهای renderCrosswordGrid که قبلاً داشتید */}
      {/* شماره‌های ستون‌ها */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `30px repeat(${size}, minmax(35px, 1fr))`,
        gap: '2px',
        marginBottom: '5px',
        direction: 'rtl',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div></div>
        {Array.from({ length: size }, (_, colIndex) => (
          <div
            key={`col-${colIndex}`}
            style={{
              minWidth: '30px',
              height: '25px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontFamily: 'Vazir, Tahoma, sans-serif',
              fontWeight: 'bold',
              color: '#666',
              direction: 'rtl'
            }}
          >
            {toPersianNumber(colIndex + 1)}
          </div>
        ))}
      </div>

      {/* جدول و شماره‌های سطرها */}
      <div style={{ 
        display: 'flex', 
        direction: 'rtl',
        width: '100%',
        maxWidth: '400px',
        justifyContent: 'center'
      }}>
        {/* شماره‌های سطرها */}
        <div style={{ 
          display: 'grid',
          gridTemplateRows: `repeat(${size}, minmax(35px, 1fr))`,
          gap: '2px'
        }}>
          {Array.from({ length: size }, (_, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              style={{
                width: '30px',
                height: '35px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontFamily: 'Vazir, Tahoma, sans-serif',
                fontWeight: 'bold',
                color: '#666',
                direction: 'rtl'
              }}
            >
              {toPersianNumber(rowIndex + 1)}
            </div>
          ))}
        </div>

        {/* خود جدول */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${size}, minmax(35px, 1fr))`,
          gap: '2px',
          direction: 'rtl',
          flex: 1
        }}>
          {dailyPuzzle.grid.map((row, rowIndex) => (
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => currentUser && handleCellSelect(rowIndex, colIndex)}
                style={{
                  width: '100%',
                  height: '35px',
                  aspectRatio: '1',
                  backgroundColor: cell === 0 ? '#333' : 
                    selectedCell[0] === rowIndex && selectedCell[1] === colIndex ? '#0070f3' :
                    cellStatus[rowIndex] && cellStatus[rowIndex][colIndex] === 'locked' ? '#2E7D32' :
                    cellStatus[rowIndex] && cellStatus[rowIndex][colIndex] === 'correct' ? '#4CAF50' :
                    cellStatus[rowIndex] && cellStatus[rowIndex][colIndex] === 'wrong' ? '#f44336' : '#fff',
                  border: cellStatus[rowIndex] && cellStatus[rowIndex][colIndex] === 'locked' ? '2px solid #1B5E20' : '1px solid #ccc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: currentUser && cell === 1 && cellStatus[rowIndex] && cellStatus[rowIndex][colIndex] !== 'locked' && !gameCompleted ? 'pointer' : 'default',
                  color: (cellStatus[rowIndex] && cellStatus[rowIndex][colIndex] === 'locked') || (cellStatus[rowIndex] && cellStatus[rowIndex][colIndex] === 'correct') ? '#fff' : '#000',
                  transition: 'all 0.2s',
                  opacity: cellStatus[rowIndex] && cellStatus[rowIndex][colIndex] === 'locked' ? 0.8 : 1,
                  direction: 'rtl',
                  textAlign: 'right',
                  fontFamily: 'Vazir, Tahoma, sans-serif'
                }}
              >
                {userInput[rowIndex] && userInput[rowIndex][colIndex] !== undefined ? userInput[rowIndex][colIndex] : ''}
                {cellStatus[rowIndex] && cellStatus[rowIndex][colIndex] === 'locked' && ' 🔒'}
              </div>
            ))
          ))}
        </div>
      </div>
    </div>
  );
};

// تابع برای عنوان عملکرد
// تابع برای عنوان عملکرد - براساس دقت
const getPerformanceTitle = (accuracy) => {
  if (accuracy >= 90) return 'استاد';
  if (accuracy >= 80) return 'حرفه‌ای';
  if (accuracy >= 70) return 'ماهر';
  if (accuracy >= 60) return 'متوسط';
  if (accuracy >= 50) return 'مبتدی';
  return 'تازه‌کار';
};

// تابع برای توضیح عملکرد
const getPerformanceDescription = (dailyLevel) => {
  if (dailyLevel >= 90) return 'عملکرد درخشان!';
  if (dailyLevel >= 80) return 'خیلی عالی!';
  if (dailyLevel >= 70) return 'خوب بازی کردی';
  if (dailyLevel >= 60) return 'قابل قبول';
  if (dailyLevel >= 50) return 'نیاز به تمرین';
  return 'تمرین بیشتر نیاز داری';
};

// تابع برای پیام انگیزشی - براساس دقت
const getMotivationalMessage = (accuracy) => {
  if (accuracy >= 90) return '🎯 شگفت‌انگیز! دقتت فوق‌العاده است!';
  if (accuracy >= 80) return '💫 عالی! خیلی دقیق بازی می‌کنی';
  if (accuracy >= 70) return '⭐ خوبه، می‌تونی بهتر هم بشی';
  if (accuracy >= 60) return '📈 آفرین، در مسیر پیشرفتی';
  if (accuracy >= 50) return '🎮 ادامه بده، تمرین کن تا دقیق‌تر بشی';
  return '💪 ناامید نشو، با تمرین دقتت بهتر می‌شه';
};


  const persianKeyboard = [
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'چ'],
    ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک', 'گ'],
    ['ظ', 'ط', 'ز', 'ر', 'ذ', 'د', 'پ', 'و', 'ئ']
  ];

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
              {dailyPuzzle?.title || 'جدول روزانه'}
            </div>
          </div>

          {/* منوی کاربر */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {currentUser.id === 'guest' ? '🎮 شما مهمان هستید' : `👋 سلام ${currentUser.first_name}!`}
                  </div>
                  <div style={{ fontSize: '12px', opacity: '0.9' }}>
                    🎯 امتیاز کل : {currentUser.total_crossword_score || 0}
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
                >
                  {currentUser.id === 'guest' ? '🚪 بستن' : '🚪 خروج'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <form onSubmit={(e) => {
              e.preventDefault();
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
  <p><strong>امتیاز امروز:</strong> {currentUser.today_crossword_score || 0}</p> {/* 🆕 از دیتابیس استفاده کن */}
  <p><strong>امتیاز لحظه‌ای:</strong> {instantScore}</p>
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

 {/* اطلاعات جدول روزانه */}
      {dailyPuzzle && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '20px', 
          backgroundColor: dailyPuzzle.closed ? '#fff3cd' : '#e8f5e8', 
          borderRadius: '10px',
          textAlign: dailyPuzzle.closed ? 'center' : 'left'
        }}>
          {dailyPuzzle.closed ? (
            // حالت بسته (۸-۹ شب)
            <div>
              <h3>⏸️ {dailyPuzzle.title}</h3>
              <p style={{ margin: '10px 0', fontSize: '16px', color: '#856404' }}>
                {dailyPuzzle.description}
              </p>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#ffeaa7', 
                borderRadius: '8px',
                margin: '10px 0'
              }}>
                <h4>🏆 نتایج امروز</h4>
                <p>برندگان امروز به زودی اعلام می‌شوند...</p>
                <p style={{ fontWeight: 'bold', marginTop: '10px' }}>
                  ⏰ بازی بعدی: ساعت {dailyPuzzle.nextOpenTime}
                </p>
              </div>
            </div>
          ) : (
            // حالت باز
            <div>
              <h3>📅 جدول روزانه</h3>
              <p style={{ margin: '5px 0', fontWeight: 'bold' }}>{dailyPuzzle.title}</p>
              <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                سایز: {dailyPuzzle.size}×{dailyPuzzle.size} | 
                تاریخ: {dailyPuzzle.date}
              </p>
            </div>
          )}
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

        {/* اگر بازی بسته است (۸-۹ شب) */}
        {dailyPuzzle?.closed && currentUser && (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            backgroundColor: '#fff3cd', 
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <h3>⏸️ بازی موقتاً تعطیل است</h3>
            <p>در حال به‌روزرسانی جدول جدید... ساعت ۹ شب بر می گردیم! 🎯</p>
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              ⏰ بازی بعدی: ساعت {dailyPuzzle.nextOpenTime}
            </p>
          </div>
        )}

        {/* اگر کاربر بازی امروز را کامل کرده */}
        {!dailyPuzzle?.closed && currentUser && todayGameCompleted && (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            backgroundColor: '#e8f5e8', 
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <h3>✅ بازی امروز تکمیل شد!</h3>
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '10px 0' }}>
              🎯 امتیاز شما امروز: <strong>{currentUser.today_crossword_score}</strong>
            </p>
            <p style={{ margin: '10px 0', color: '#666' }}>
              ⏰ ساعت ۹ شب با جدول جدید بر می گردیم! 🎯
            </p>
          </div>
        )}

  {/* بازی فعال - تست کامل */}
{!dailyPuzzle?.closed && currentUser && (
  <div style={{ marginBottom: '40px' }}>
    
  

    {/* 🆕强制 فراخوانی initializeGame */}
    {(() => {
      console.log('🎯强制 اجرای initializeGame...');
      if (dailyPuzzle && currentUser) {
        console.log('🔍 شرایط مناسب برای initializeGame');
        if (userInput.length === 0) {
          console.log('🚀 اجرای initializeGame');
          initializeGame();
        } else {
          console.log('⏩ بازی قبلاً initialize شده');
        }
      }
      return null;
    })()}

   

    {/* محتوای جدول */}
    {renderCrosswordGrid()}

    {/* اگر جدول خالیه، پیام نمایش بده */}
    {dailyPuzzle && userInput.length === 0 && (
      <div style={{
        padding: '20px', 
        backgroundColor: '#f44336', 
        color: 'white',
        textAlign: 'center',
        marginBottom: '15px',
        borderRadius: '8px'
      }}>
        ❌ مشکل: تابع renderCrosswordGrid خالی برمی‌گرداند
      </div>
    )}

    {/* راهنما */}
    {dailyPuzzle && (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '14px' }}>
        <div>
          <h3>➡️ افقی</h3>
          {Object.entries(dailyPuzzle.across).map(([num, clue]) => (
            <p key={num} style={{ margin: '5px 0' }}>
              <strong>{num}:</strong> {clue.clue}
            </p>
          ))}
        </div>
        <div>
          <h3>⬇️ عمودی</h3>
          {Object.entries(dailyPuzzle.down).map(([num, clue]) => (
            <p key={num} style={{ margin: '5px 0' }}>
              <strong>{num}:</strong> {clue.clue}
            </p>
          ))}
        </div>
      </div>
    )}

    {/* صفحه کلید */}
    {!gameCompleted && (
      <div style={{ 
        marginBottom: '20px',
        padding: '10px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: '15px', fontSize: '16px' }}>صفحه کلید</h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          width: '100%',
          padding: '0 5px'
        }}>
          {persianKeyboard.map((row, rowIndex) => (
            <div key={rowIndex} style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '3px', 
              marginBottom: '6px',
              flexWrap: 'wrap',
              width: '100%',
              maxWidth: '350px'
            }}>
              {row.map(char => (
                <div
                  key={char}
                  onClick={() => handleInput(char)}
                  style={{
                    padding: '6px 8px',
                    fontSize: '13px',
                    border: '1px solid #ccc',
                    backgroundColor: '#f0f0f0',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    minWidth: '30px',
                    textAlign: 'center',
                    flexShrink: 0
                  }}
                >
                  {char}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}
      </div>


      {/* منوی اختصاصی: کارنامه روزانه */}
      {currentUser && (
        <div style={{ 
          marginBottom: '40px', 
          padding: '25px', 
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          borderRadius: '15px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          color: 'white',
          border: '2px solid #8b5cf6'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px'
          }}>
            <div>
              <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', color: 'white' }}>
                📊 کارنامه روزانه
              </h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', color: 'white' }}>
                عملکرد امروز شما در بازی کراسورد
              </p>
            </div>
          </div>

          {/* کارت‌های اطلاعات - آمار دقیق */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            {/* کارت دقت */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              padding: '15px',
              borderRadius: '10px',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px', color: 'white' }}>
                ✅ دقت پاسخ‌ها
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                {dailyPerformance.accuracy}%
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, color: 'white' }}>
                {dailyPerformance.correctCells} از {dailyPerformance.totalCells} خانه
              </div>
            </div>

            {/* کارت خطا */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              padding: '15px',
              borderRadius: '10px',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px', color: 'white' }}>
                ❌ خانه‌های اشتباه
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                {dailyPerformance.uniqueWrongCells}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, color: 'white' }}>
                از {dailyPerformance.totalCells} خانه
              </div>
            </div>

            {/* کارت اشتباهات کل */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              padding: '15px',
              borderRadius: '10px',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px', color: 'white' }}>
                🔄 کل اشتباهات
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                {dailyPerformance.totalMistakes}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, color: 'white' }}>
                تعداد دفعات اشتباه
              </div>
            </div>

            {/* کارت جایگاه */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              padding: '15px',
              borderRadius: '10px',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px', color: 'white' }}>
                🏆 جایگاه
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>
                {getPerformanceTitle(dailyPerformance.accuracy)}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, color: 'white' }}>
                {getPerformanceDescription(dailyPerformance.accuracy)}
              </div>
            </div>
          </div>

          {/* پیام انگیزشی */}
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: '10px',
            textAlign: 'center',
            fontSize: '14px',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white'
          }}>
            {getMotivationalMessage(dailyPerformance.accuracy)}
          </div>
        </div>
      )}

      {/* نمودارهای پیشرفت */}
      <ProgressChart users={users} currentUser={currentUser} />
     
     {/* چالش سریع روزانه - کاملاً مستقل */}
<div className="mb-8">
  <DailyChallenge currentUser={currentUser} />
</div>

{/* بازی کارت‌های حافظه - کاملاً مستقل */}
<div className="mb-8">
  <MemoryGame currentUser={currentUser} />
</div>

      {/* لیست کاربران */}
      <div>
        <h2>رده‌بندی کاربران</h2>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
          🔄 به روزرسانی خودکار هر یک دقیقه - مرتب شده بر اساس امتیاز
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
       {currentUser && (
              <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <GameHistory 
                  userId={currentUser.id} 
                  key={gameHistoryKey}
                />
              </div>
            )}
    </div>
  );
}