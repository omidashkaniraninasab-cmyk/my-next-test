import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    console.log('🎯 دریافت رتبه‌بندی چالش...');
    
    // گرفتن ALL فیلدها از جدول
    const leaderboard = await sql`
      SELECT 
        user_id,
        username,
        user_code,
        display_name,
        total_score,
        today_score,
        games_played
      FROM daily_challenge_scores 
      ORDER BY total_score DESC
      LIMIT 50
    `;
    
    console.log('🔍 اولین کاربر:', leaderboard[0]);
    
    const leaderboardWithRanks = leaderboard.map((user, index) => ({
      rank: index + 1,
      userId: String(user.user_id),
      displayName: user.display_name, // استفاده از display_name واقعی
      username: user.username,
      userCode: user.user_code,
      totalScore: user.total_score || 0,
      gamesPlayed: user.games_played || 0,
      todayScore: user.today_score || 0
    }));
    
    return NextResponse.json({
      success: true,
      leaderboard: leaderboardWithRanks,
      totalPlayers: leaderboard.length
    });
    
  } catch (error) {
    console.error('❌ خطا در دریافت رتبه‌بندی:', error);
    return NextResponse.json({ 
      success: true,
      leaderboard: [],
      error: error.message
    });
  }
}