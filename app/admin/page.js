'use client';
import { useState } from 'react';

export default function AdminPanel() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/admin/publish-puzzle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('✅ جدول با موفقیت منتشر شد!');
      } else {
        setMessage('❌ خطا: ' + result.error);
      }
    } catch (error) {
      setMessage('❌ خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '40px', 
      maxWidth: '600px', 
      margin: '0 auto',
      fontFamily: 'system-ui'
    }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>
        🎯 پنل مدیریت جدول روزانه
      </h1>
      
      <div style={{
        marginTop: '30px',
        padding: '20px',
        border: '2px solid #e0e0e0',
        borderRadius: '10px',
        backgroundColor: '#f9f9f9'
      }}>
        <h3 style={{ color: '#555' }}>📊 وضعیت فعلی</h3>
        <p>برای انتشار جدول جدید، دکمه زیر را بزنید:</p>
        
        {message && (
          <div style={{
            padding: '10px',
            backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
            border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '5px',
            marginBottom: '15px',
            color: message.includes('✅') ? '#155724' : '#721c24'
          }}>
            {message}
          </div>
        )}

        <button 
          onClick={handlePublish}
          disabled={loading}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '18px',
            backgroundColor: loading ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {loading ? '⏳ در حال انتشار...' : '🚀 انتشار جدول جدید از فایل'}
        </button>

        <div style={{ 
          marginTop: '20px', 
          padding: '15px',
          backgroundColor: '#e7f3ff',
          borderRadius: '5px',
          fontSize: '14px'
        }}>
          <strong>ℹ️ راهنما:</strong>
          <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
            <li>ابتدا فایل <code>lib/dailyPuzzleData.js</code> را ویرایش کنید</li>
            <li>سپس دکمه بالا را بزنید</li>
            <li>همه کاربران بلافاصله جدول جدید را می‌بینند</li>
          </ul>
        </div>
      </div>
    </div>
  );
}