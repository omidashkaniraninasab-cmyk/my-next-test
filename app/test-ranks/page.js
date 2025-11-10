'use client';
import { useEffect, useState } from 'react';

export default function TestRanks() {
  const [result, setResult] = useState('');

  useEffect(() => {
    fetch('/api/users/update-ranks', { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    })
    .then(r => r.json())
    .then(setResult)
    .catch(error => setResult(`Error: ${error.message}`));
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Ranks Update</h1>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}