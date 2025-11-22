import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    console.log('🎯 دریافت رتبه‌بندی چالش...');
    
    // گرفتن رتبه‌بندی از دیتابیس با display_name
    const leaderboard = await sql`
      SELECT 
        user_id,
        display_name,  // استفاده از display_name
        username,
        user_code,
        total_score,
        today_score,
        games_played,
        created_at
      FROM daily_challenge_scores 
      ORDER BY total_score DESC, created_at ASC
      LIMIT 50
    `;
    
    const leaderboardWithRanks = leaderboard.map((user, index) => ({
      rank: index + 1,
      userId: String(user.user_id),
      displayName: user.display_name || user.username || `User${user.user_id}`,
      username: user.username,
      userCode: user.user_code,
      totalScore: user.total_score || 0,
      gamesPlayed: user.games_played || 0,
      todayScore: user.today_score || 0,
      joinedDate: user.created_at
    }));
    
    // تعداد کل بازیکنان
    const totalPlayersResult = await sql`
      SELECT COUNT(*) as count FROM daily_challenge_scores
    `;
    const totalPlayers = totalPlayersResult[0]?.count || 0;
    
    console.log('✅ رتبه‌بندی دریافت شد:', { 
      totalPlayers, 
      topPlayers: leaderboard.length,
      sampleUser: leaderboardWithRanks[0] // برای دیباگ
    });
    
    return NextResponse.json({
      success: true,
      leaderboard: leaderboardWithRanks,
      gameType: 'daily-challenge',
      totalPlayers,
      updatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ خطا در دریافت رتبه‌بندی:', error);
    
    return NextResponse.json({ 
      success: true,
      leaderboard: [],
      gameType: 'daily-challenge',
      totalPlayers: 0,
      updatedAt: new Date().toISOString(),
      error: 'خطای موقت در دریافت داده‌ها'
    });
  }
}