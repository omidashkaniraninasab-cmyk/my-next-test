import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    console.log('🎮 دریافت رتبه‌بندی بازی حافظه...');
    
    // گرفتن رتبه‌بندی از دیتابیس
    const leaderboard = await sql`
      SELECT 
        user_id,
        total_score,
        today_score,
        games_played,
        best_time,
        created_at
      FROM memory_game_scores 
      ORDER BY total_score DESC, best_time ASC
      LIMIT 50
    `;
    
    // 🔥 FIX: تبدیل userId به string برای جلوگیری از خطای slice
    const leaderboardWithRanks = leaderboard.map((user, index) => ({
      rank: index + 1,
      userId: String(user.user_id), // تبدیل اجباری به string
      totalScore: user.total_score || 0,
      gamesPlayed: user.games_played || 0,
      todayScore: user.today_score || 0,
      bestTime: user.best_time || 0,
      joinedDate: user.created_at
    }));
    
    // تعداد کل بازیکنان
    const totalPlayersResult = await sql`
      SELECT COUNT(*) as count FROM memory_game_scores
    `;
    const totalPlayers = totalPlayersResult[0]?.count || 0;
    
    console.log('✅ رتبه‌بندی بازی حافظه دریافت شد:', { 
      totalPlayers, 
      topPlayers: leaderboard.length 
    });
    
    return NextResponse.json({
      success: true,
      leaderboard: leaderboardWithRanks,
      gameType: 'memory-game',
      totalPlayers,
      updatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ خطا در دریافت رتبه‌بندی بازی حافظه:', error);
    
    // 🔥 برگرداندن داده‌های نمونه در صورت خطا
    return NextResponse.json({ 
      success: true,
      leaderboard: [],
      gameType: 'memory-game',
      totalPlayers: 0,
      updatedAt: new Date().toISOString(),
      error: 'خطای موقت در دریافت داده‌ها'
    });
  }
}