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
        // لیست کاربران رو آپدیت کن
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
      console.error('Error fetching users:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // لیست کاربران رو بگیر
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>به وبسایت ما خوش آمدید! 👋</h1>
      
      {!isRegistered ? (
        <div>
          <p>شما به عنوان مهمان وارد شده‌اید</p>
          <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ddd' }}>
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
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#d4edda', color: '#155724' }}>
          ✅ ثبت‌نام شما با موفقیت انجام شد!
        </div>
      )}

      <div style={{ marginTop: '40px' }}>
        <h2>کاربران سایت</h2>
        {users.length === 0 ? (
          <p>هنوز کاربری ثبت‌نام نکرده است</p>
        ) : (
          <ul>
            {users.map(user => (
              <li key={user.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee' }}>
                <strong>{user.username}</strong> - {user.first_name} {user.last_name}
                <br />
                📧 {user.email}
                <br />
                🎯 امتیاز کل: {user.total_crossword_score || 0}
                <br />
                ⏰ تاریخ ثبت‌نام: {new Date(user.registration_date).toLocaleString('fa-IR')}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}