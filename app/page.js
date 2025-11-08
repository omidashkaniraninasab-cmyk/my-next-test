'use client';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [isRegistered, setIsRegistered] = useState(false);
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
  const [activeMenu, setActiveMenu] = useState('register'); // منوی فعال

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
        setIsRegistered(true);
        setFormData({
          username: '',
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          bankCardNumber: ''
        });
        await fetchUsers(); // آپدیت لیست کاربران
        setActiveMenu('users'); // برو به منوی کاربران
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
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
      console.error('Error fetching users:', error);
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
    const interval = setInterval(fetchUsers, 10000); // هر 10 ثانیه
    return () => clearInterval(interval);
  }, []);

  // آمار کلی
  const totalUsers = users.length;
  const totalScore = users.reduce((sum, user) => sum + (user.total_crossword_score || 0), 0);
  const avgScore = totalUsers > 0 ? (totalScore / totalUsers).toFixed(1) : 0;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>به وبسایت کراسورد خوش آمدید! 🎯</h1>
      
      {/* منوی اصلی */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveMenu('register')}
          style={{
            padding: '10px 20px',
            margin: '0 5px',
            backgroundColor: activeMenu === 'register' ? '#0070f3' : '#f0f0f0',
            color: activeMenu === 'register' ? 'white' : 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          📝 ثبت‌نام
        </button>
        <button 
          onClick={() => setActiveMenu('users')}
          style={{
            padding: '10px 20px',
            margin: '0 5px',
            backgroundColor: activeMenu === 'users' ? '#0070f3' : '#f0f0f0',
            color: activeMenu === 'users' ? 'white' : 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          👥 کاربران ({totalUsers})
        </button>
        <button 
          onClick={() => setActiveMenu('stats')}
          style={{
            padding: '10px 20px',
            margin: '0 5px',
            backgroundColor: activeMenu === 'stats' ? '#0070f3' : '#f0f0f0',
            color: activeMenu === 'stats' ? 'white' : 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          📊 آمار کلی
        </button>
      </div>

      {/* منوی ثبت‌نام */}
      {activeMenu === 'register' && (
        <div>
          {!isRegistered ? (
            <div>
              <p>شما به عنوان مهمان وارد شده‌اید</p>
              <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
                <h2>ثبت‌نام در سایت</h2>
                <form onSubmit={handleRegister}>
                  <div style={{ marginBottom: '15px' }}>
                    <label>نام کاربری: </label>
                    <input 
                      type="text" 
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      style={{ padding: '5px', width: '200px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label>ایمیل: </label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      style={{ padding: '5px', width: '200px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label>پسورد: </label>
                    <input 
                      type="password" 
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      style={{ padding: '5px', width: '200px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label>نام: </label>
                    <input 
                      type="text" 
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      style={{ padding: '5px', width: '200px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label>نام خانوادگی: </label>
                    <input 
                      type="text" 
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      style={{ padding: '5px', width: '200px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label>شماره کارت بانکی: </label>
                    <input 
                      type="text" 
                      name="bankCardNumber"
                      value={formData.bankCardNumber}
                      onChange={handleInputChange}
                      style={{ padding: '5px', width: '200px' }}
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={loading}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: loading ? '#ccc' : '#0070f3', 
                      color: 'white', 
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? 'در حال ثبت...' : 'ثبت‌نام'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '5px' }}>
              ✅ ثبت‌نام شما با موفقیت انجام شد!
            </div>
          )}
        </div>
      )}

      {/* منوی کاربران */}
      {activeMenu === 'users' && (
        <div>
          <h2>لیست کاربران</h2>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
            🔄 به روزرسانی خودکار هر 10 ثانیه
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
                  backgroundColor: '#f9f9f9'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <strong>👤 {user.username}</strong> - {user.first_name} {user.last_name}
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
      )}

      {/* منوی آمار */}
      {activeMenu === 'stats' && (
        <div>
          <h2>آمار کلی سایت</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
            <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalUsers}</div>
              <div>👥 تعداد کاربران</div>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalScore}</div>
              <div>🎯 مجموع امتیازات</div>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#fff3e0', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{avgScore}</div>
              <div>📊 میانگین امتیاز</div>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#fce4ec', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {users.filter(user => user.total_crossword_score > 0).length}
              </div>
              <div>🏆 کاربران فعال</div>
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <h3>کاربران برتر</h3>
            {users.length === 0 ? (
              <p>هنوز کاربری وجود ندارد</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {users
                  .filter(user => user.total_crossword_score > 0)
                  .sort((a, b) => (b.total_crossword_score || 0) - (a.total_crossword_score || 0))
                  .slice(0, 5)
                  .map((user, index) => (
                    <div key={user.id} style={{ 
                      padding: '15px', 
                      border: '1px solid #ddd', 
                      borderRadius: '8px',
                      backgroundColor: index === 0 ? '#fff9c4' : '#f9f9f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <span style={{ fontSize: '18px', marginRight: '10px' }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                        </span>
                        <strong>{user.username}</strong> - {user.first_name} {user.last_name}
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#0070f3' }}>
                        🎯 {user.total_crossword_score || 0} امتیاز
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}