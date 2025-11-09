'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function ProgressChart({ users, currentUser }) {
  // داده‌های برای نمودار خطی پیشرفت کاربران برتر
  const topUsersProgress = users
    .sort((a, b) => (b.total_crossword_score || 0) - (a.total_crossword_score || 0))
    .slice(0, 5)
    .map(user => ({
      name: user.username,
      امتیاز: user.total_crossword_score || 0,
      بازی: user.crossword_games_played || 0
    }));

  // داده‌های برای نمودار میله‌ای توزیع امتیازات
  const scoreDistribution = [
    { range: '۰-۵۰', تعداد: users.filter(u => (u.total_crossword_score || 0) <= 50).length },
    { range: '۵۱-۱۰۰', تعداد: users.filter(u => (u.total_crossword_score || 0) > 50 && (u.total_crossword_score || 0) <= 100).length },
    { range: '۱۰۱-۲۰۰', تعداد: users.filter(u => (u.total_crossword_score || 0) > 100 && (u.total_crossword_score || 0) <= 200).length },
    { range: '۲۰۱+', تعداد: users.filter(u => (u.total_crossword_score || 0) > 200).length }
  ];

  // داده‌های برای نمودار فعالیت کاربر جاری
  const currentUserStats = currentUser ? [
    { نام: 'امتیاز کل', مقدار: currentUser.total_crossword_score || 0 },
    { نام: 'بازی‌ها', مقدار: currentUser.crossword_games_played || 0 },
    { نام: 'امتیاز امروز', مقدار: currentUser.today_crossword_score || 0 },
    { نام: 'بازی کامل', مقدار: currentUser.completed_crossword_games || 0 }
  ] : [];

  return (
    <div style={{ marginBottom: '40px' }}>
      <h2>📊 آمار و نمودارها</h2>
      
      {/* نمودار کاربران برتر */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
        <h3>📈 کاربران برتر</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={topUsersProgress}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="امتیاز" stroke="#8884d8" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="بازی" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* نمودار توزیع امتیازات */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
        <h3>📊 توزیع امتیازات کاربران</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={scoreDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="تعداد" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* نمودار کاربر جاری */}
      {currentUser && (
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
          <h3>👤 آمار شما - {currentUser.first_name}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={currentUserStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="نام" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="مقدار" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}