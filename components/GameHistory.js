'use client';
import { useState, useEffect } from 'react';

export default function GameHistory({ userId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadGameHistory();
    }
  }, [userId]);

  const loadGameHistory = async () => {
    try {
      const response = await fetch(`/api/users/game-history?userId=${userId}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error loading game history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fa-IR');
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div>در حال بارگذاری تاریخچه...</div>;
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>📜 تاریخچه بازی‌های قبلی</h3>
      
      {history.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
          هنوز بازی‌ای ثبت نشده است
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {history.map((game, index) => (
            <div key={game.id} style={{
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    {game.puzzle_title} ({game.puzzle_size}×{game.puzzle_size})
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    {formatDate(game.created_at)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0070f3' }}>
                    🎯 {game.score}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    ❌ {game.mistakes} اشتباه
                  </div>
                  {game.play_duration && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      ⏱️ {formatDuration(game.play_duration)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}