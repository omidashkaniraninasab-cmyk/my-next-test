'use client';
import { useState } from 'react';

export default function AddUser() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // اطلاعات فرم را به سرور می‌فرستیم
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email }),
    });

    if (response.ok) {
      setMessage('✅ کاربر با موفقیت ذخیره شد!');
      setName('');
      setEmail('');
    } else {
      setMessage('❌ خطا در ذخیره کاربر');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <h1>اضافه کردن کاربر جدید</h1>
      
      <form onSubmit={handleSubmit}>
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
          ذخیره کاربر
        </button>
      </form>

      {message && <p style={{ marginTop: '15px' }}>{message}</p>}
    </div>
  );
}