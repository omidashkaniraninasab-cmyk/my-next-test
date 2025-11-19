import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    console.log('🎯 دریافت رتبه‌بندی چالش...');
    
    // گرفتن رتبه‌بندی از دیتابیس
    const leaderboard = await sql`
      SELECT 
        user_id,
        total_score,
        today_score,
        games_played,
        created_at
      FROM daily_challenge_scores 
      ORDER BY total_score DESC
      LIMIT 50
    `;
    
    const leaderboardWithRanks = leaderboard.map((user, index) => ({
      rank: index + 1,
      userId: user.user_id,
      totalScore: user.total_score,
      gamesPlayed: user.games_played,
      todayScore: user.today_score,
      joinedDate: user.created_at
    }));
    
    // تعداد کل بازیکنان
    const totalPlayersResult = await sql`
      SELECT COUNT(*) as count FROM daily_challenge_scores
    `;
    const totalPlayers = totalPlayersResult[0]?.count || 0;
    
    console.log('✅ رتبه‌بندی دریافت شد:', { totalPlayers, topPlayers: leaderboard.length });
    
    return NextResponse.json({
      success: true,
      leaderboard: leaderboardWithRanks,
      gameType: 'daily-challenge',
      totalPlayers,
      updatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ خطا در دریافت رتبه‌بندی:', error);
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 });
  }
}