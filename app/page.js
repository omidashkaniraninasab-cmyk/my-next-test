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
        await fetchUsers();
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
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>به وبسایت کراسورد خوش آمدید! 🎯</h1>
      
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

      {/* فرم ثبت‌نام */}
      <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
        <h2>ثبت‌نام در سایت</h2>
        {!isRegistered ? (
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
              {loading ? 'در حال ثبت...' : 'ثبت‌نام'}
            </button>
          </form>
        ) : (
          <div style={{ padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '5px' }}>
            ✅ ثبت‌نام شما با موفقیت انجام شد!
          </div>
        )}
      </div>

      {/* لیست کاربران */}
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
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>
                    ⏰ {new Date(user.registration_date).toLocaleString('fa-IR')}
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