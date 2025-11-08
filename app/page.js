'use client';
import { useState, useEffect } from 'react';

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
  const [activeTab, setActiveTab] = useState('profile'); // تب فعال

  // وقتی صفحه لود شد، کاربر لاگین شده رو از localStorage بگیر
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    fetchUsers();
  }, []);

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
        
        // کاربر رو لاگین کن و در localStorage ذخیره کن
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
        setActiveTab('profile'); // برو به تب پروفایل
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
    setActiveTab('register'); // برگرد به تب ثبت‌نام
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

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // آپدیت خودکار لیست کاربران هر 10 ثانیه
  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  // آمار
  const totalUsers = users.length;
  const totalScore = users.reduce((sum, user) => sum + (user.total_crossword_score || 0), 0);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* هدر با وضعیت کاربر */}
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
              <div style={{ fontSize: '14px', color: '#666' }}>@{currentUser.username}</div>
            </div>
            <button 
              onClick={handleLogout}
              style={{ 
                padding: '8px 15px', 
                backgroundColor: '#ff4444', 
                color: 'white', 
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              خروج
            </button>
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

      {/* منوی تب‌ها برای کاربران لاگین شده */}
      {currentUser && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            borderBottom: '1px solid #ddd',
            paddingBottom: '10px'
          }}>
            <button 
              onClick={() => setActiveTab('profile')}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === 'profile' ? '#0070f3' : 'transparent',
                color: activeTab === 'profile' ? 'white' : '#0070f3',
                border: '1px solid #0070f3',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              👤 پروفایل من
            </button>
            <button 
              onClick={() => setActiveTab('stats')}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === 'stats' ? '#0070f3' : 'transparent',
                color: activeTab === 'stats' ? 'white' : '#0070f3',
                border: '1px solid #0070f3',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              📊 آمار من
            </button>
            <button 
              onClick={() => setActiveTab('leaderboard')}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === 'leaderboard' ? '#0070f3' : 'transparent',
                color: activeTab === 'leaderboard' ? 'white' : '#0070f3',
                border: '1px solid #0070f3',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              🏆 رده‌بندی
            </button>
          </div>
        </div>
      )}

      {/* محتوای تب‌ها */}
      {currentUser ? (
        <div>
          {/* تب پروفایل */}
          {activeTab === 'profile' && (
            <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
              <h2>👤 پروفایل کاربری</h2>
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

          {/* تب آمار */}
          {activeTab === 'stats' && (
            <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
              <h2>📊 آمار و عملکرد من</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
                <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{currentUser.total_crossword_score || 0}</div>
                  <div>🎯 امتیاز کل</div>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{currentUser.crossword_games_played || 0}</div>
                  <div>🎮 تعداد بازی</div>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#fff3e0', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{currentUser.completed_crossword_games || 0}</div>
                  <div>✅ بازی کامل</div>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#fce4ec', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{currentUser.crossword_rank || 'جدید'}</div>
                  <div>🏆 رتبه</div>
                </div>
              </div>
            </div>
          )}

          {/* تب رده‌بندی */}
          {activeTab === 'leaderboard' && (
            <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
              <h2>🏆 رده‌بندی کاربران</h2>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                🔄 به روزرسانی خودکار هر 10 ثانیه
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
                        backgroundColor: user.id === currentUser.id ? '#e3f2fd' : '#f9f9f9',
                        borderLeft: user.id === currentUser.id ? '4px solid #0070f3' : '1px solid #ddd'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ 
                              fontSize: '18px', 
                              fontWeight: 'bold',
                              width: '30px',
                              textAlign: 'center'
                            }}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `🏅 ${index + 1}`}
                            </span>
                            <div>
                              <strong>{user.username}</strong> - {user.first_name} {user.last_name}
                              {user.id === currentUser.id && <span style={{color: 'green', marginRight: '10px'}}> (شما)</span>}
                            </div>
                          </div>
                          <div style={{ fontWeight: 'bold', color: '#0070f3', fontSize: '18px' }}>
                            🎯 {user.total_crossword_score || 0}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* فرم ثبت‌نام برای کاربران لاگین نشده */
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
              disabled={loading}
              style={{ 
                marginTop: '20px',
                padding: '10px 20px', 
                backgroundColor: loading ? '#ccc' : '#0070f3', 
                color: 'white', 
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'در حال ثبت...' : 'ثبت‌نام و ورود'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}