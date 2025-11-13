'use client';
import { useState, useEffect } from 'react';
import { getSessionFromCookie, logout } from '@/lib/client-auth';
import ProgressChart from '../components/ProgressChart';
import GameHistory from '../components/GameHistory';

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
    
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  const restoreSession = async () => {
    try {
      console.log('🔄 Restoring session after page refresh...');
      
      const user = await getSessionFromCookie();
      
      if (user) {
        console.log('✅ Session restored successfully:', user.id);
        setCurrentUser(user);
        
        await updateLoginTime(user.id);
        await fetchUserStats(user.id);
        await checkGameStatus(user.id);
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
      
      const response = await fetch('/api/daily-puzzle');
      
      if (response.status === 423) {
        const closedData = await response.json();
        setDailyPuzzle({
          closed: true,
          title: closedData.message,
          description: closedData.description,
          nextOpenTime: closedData.nextOpenTime
        });
        console.log('⏸️ Game is closed until 21:00');
      } else if (response.ok) {
        const puzzleData = await response.json();
        setDailyPuzzle(puzzleData);
        console.log('✅ Daily puzzle loaded');
      } else {
        throw new Error('Failed to load puzzle');
      }
      
    } catch (error) {
      console.error('💥 Error loading daily puzzle:', error);
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
        
        await updateUserScoreInDB(userId, 0, 0);
        
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

  const updateUserScoreInDB = async (userId, additionalScore, currentInstantScore) => {
    try {
      const response = await fetch('/api/users/update-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          additionalScore: additionalScore,
          currentInstantScore: currentInstantScore
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
          mistakes: currentMistakes
        }),
      });
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  };

  const handleInput = async (char) => {
    if (gameCompleted || !currentUser || !currentGameId || !dailyPuzzle) return;

    const [row, col] = selectedCell;
    
    if (cellStatus[row][col] === 'locked') return;

    const newInput = [...userInput];
    newInput[row][col] = char;
    setUserInput(newInput);

    const isCorrect = char === dailyPuzzle.solution[row][col];
    const newCellStatus = [...cellStatus];

    let scoreToAdd = 0;
    let newInstantScore = instantScore;

    if (isCorrect) {
      newCellStatus[row][col] = 'locked';
      scoreToAdd = 3;
      newInstantScore = instantScore + scoreToAdd;
    } else {
      newCellStatus[row][col] = 'wrong';
      scoreToAdd = -3;
      newInstantScore = instantScore + scoreToAdd;
      setMistakes(mistakes + 1);
    }

    setScore(score + scoreToAdd);
    setInstantScore(newInstantScore);
    setCellStatus(newCellStatus);

    await saveGameStateToServer(newInput, newCellStatus, score + scoreToAdd, mistakes + (isCorrect ? 0 : 1));

    if (scoreToAdd !== 0) {
      await updateUserScoreInDB(currentUser.id, scoreToAdd, newInstantScore);
    }

    if (!isCorrect) {
      moveToNextCell(row, col);
    } else {
      findNextUnlockedCell();
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

  const checkGameCompletion = async () => {
    if (!dailyPuzzle) return;
    
    let allLocked = true;
    
    for (let i = 0; i < dailyPuzzle.size; i++) {
      for (let j = 0; j < dailyPuzzle.size; j++) {
        if (dailyPuzzle.grid[i][j] === 1 && cellStatus[i][j] !== 'locked') {
          allLocked = false;
          break;
        }
      }
      if (!allLocked) break;
    }

    if (allLocked && !gameCompleted) {
      const bonusScore = 50;
      const finalScore = score + bonusScore;
      
      setScore(finalScore);
      setGameCompleted(true);
      setTodayGameCompleted(true);
      setInstantScore(0);
      
      try {
        await fetch('/api/users/update-score', {
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
        console.log('✅ Bonus score added');
      } catch (error) {
        console.error('❌ Error adding bonus:', error);
      }

      try {
        await fetch('/api/game/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gameId: currentGameId,
            finalScore: finalScore,
            userId: currentUser.id
          }),
        });
        console.log('✅ Game status completed');
      } catch (error) {
        console.error('❌ Error completing game status:', error);
      }

      await fetchUserStats(currentUser.id);
      await saveGameToHistory(currentUser.id, currentGameId, dailyPuzzle, mistakes);
      
      console.log('🎉 Game completed with bonus!');
    }
  };

  const saveGameToHistory = async (userId, gameId, puzzleData, mistakes) => {
    try {
      await fetch('/api/game/save-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          gameId: gameId,
          puzzleData: puzzleData,
          mistakes: mistakes
        }),
      });
      console.log('✅ Game saved to history with today_score');
    } catch (error) {
      console.error('Error saving game history:', error);
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
      const response = await fetch(`/api/game/status?userId=${userId}`);
      if (response.ok) {
        const status = await response.json();
        setTodayGameCompleted(status.today_game_completed);
        console.log('🎮 Game status:', status.today_game_completed ? 'Completed' : 'Not completed');
      }
    } catch (error) {
      console.error('Error checking game status:', error);
    }
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
              <p><strong>امتیاز امروز:</strong> {currentUser.today_crossword_score || 0}</p>
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
    </div>
  )}

  {/* بازی فعال - فقط وقتی کاربر لاگین کرده، بازی باز است و هنوز بازی نکرده */}
  {!dailyPuzzle?.closed && currentUser && !todayGameCompleted && !gameCompleted && (
    <div style={{ marginBottom: '40px' }}>
      {/* محتوای جدول و صفحه کلید */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${dailyPuzzle ? dailyPuzzle.size : 6}, 60px)`,
        gap: '2px',
        marginBottom: '20px'
      }}>
        {dailyPuzzle && dailyPuzzle.grid.map((row, rowIndex) => (
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

      {/* صفحه کلید - فقط وقتی بازی باز است */}
      {!gameCompleted && (
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
    </div>
  )}

  {/* پیام بعد از اتمام بازی - کاربر امروز بازی کرده */}
  {(todayGameCompleted || gameCompleted) && currentUser && (
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
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#d4edda', 
        borderRadius: '8px',
        margin: '10px 0'
      }}>
        <h4>🏆 امروز بازی کردید</h4>
        <p>می‌توانید نتایج دیگران را در رده‌بندی مشاهده کنید</p>
      </div>
    </div>
  )}
</div>

{/* لیست کاربران - مرتب شده بر اساس امتیاز کل */}
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
    </div>
  );
}