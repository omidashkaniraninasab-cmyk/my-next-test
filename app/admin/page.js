'use client';
import { useState } from 'react';

export default function AdminPanel() {
  const [message, setMessage] = useState('');
  
  const handleSubmit = async (formData) => {
    const puzzleData = {
      date: formData.get('date'),
      title: formData.get('title'),
      size: 5,
      grid: [
        [1,1,1,1,1],
        [1,1,1,1,1], 
        [1,1,1,1,1],
        [1,1,1,1,1],
        [1,1,1,1,1]
      ],
      solution: [
        ["الف","ب","پ","ت","ث"],
        ["ج","چ","ح","خ","د"],
        ["ذ","ر","ز","ژ","س"],
        ["ش","ص","ض","ط","ظ"],
        ["ع","غ","ف","ق","ک"]
      ],
      across: {
        "1": { clue: formData.get('across1'), row: 0, col: 0, length: 5 }
      },
      down: {
        "1": { clue: formData.get('down1'), row: 0, col: 0, length: 5 }
      }
    };

    try {
      const response = await fetch('/api/admin/daily-puzzle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(puzzleData)
      });

      const result = await response.json();
      setMessage(result.success ? '✅ جدول با موفقیت ذخیره شد!' : '❌ خطا: ' + result.error);
    } catch (error) {
      setMessage('❌ خطا در ارتباط با سرور');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>پنل مدیریت جدول‌های روزانه</h1>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '5px',
          marginBottom: '20px',
          color: message.includes('✅') ? '#155724' : '#721c24'
        }}>
          {message}
        </div>
      )}

      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(new FormData(e.target));
        }}
        style={{
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '10px',
          backgroundColor: '#f9f9f9'
        }}
      >
        <h3>افزودن جدول جدید</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            تاریخ جدول:
          </label>
          <input 
            type="date" 
            name="date"
            required
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ccc', 
              borderRadius: '4px' 
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            عنوان جدول:
          </label>
          <input 
            type="text" 
            name="title"
            placeholder="مثلاً: جدول یکشنبه"
            required
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ccc', 
              borderRadius: '4px' 
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            سرنخ افقی ۱:
          </label>
          <input 
            type="text" 
            name="across1"
            placeholder="مثلاً: اولین سرود"
            required
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ccc', 
              borderRadius: '4px' 
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            سرنخ عمودی ۱:
          </label>
          <input 
            type="text" 
            name="down1"
            placeholder="مثلاً: نخستین خانه" 
            required
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ccc', 
              borderRadius: '4px' 
            }}
          />
        </div>

        <button 
          type="submit"
          style={{
            padding: '12px 30px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          📤 ذخیره جدول
        </button>
      </form>
    </div>
  );
}