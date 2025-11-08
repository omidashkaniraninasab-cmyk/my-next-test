'use client';
import { useState } from 'react';

export default function HomePage() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [users, setUsers] = useState([]);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email }),
    });

    if (response.ok) {
      setIsRegistered(true);
      setName('');
      setEmail('');
      // لیست کاربران رو آپدیت کن
      const updatedUsers = await fetch('/api/users').then(res => res.json());
      setUsers(updatedUsers);
    }
  };

  // لیست کاربران رو بگیر
  useState(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(setUsers);
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
                <label>نام: </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ padding: '5px', width: '200px' }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label>ایمیل: </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ padding: '5px', width: '200px' }}
                />
              </div>
              
              <button 
                type="submit"
                style={{ padding: '8px 16px', backgroundColor: '#0070f3', color: 'white', border: 'none' }}
              >
                ثبت‌نام
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
                <strong>{user.name}</strong> - {user.email}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}