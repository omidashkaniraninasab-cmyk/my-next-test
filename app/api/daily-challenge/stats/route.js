import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });
    }
    
    console.log('🎯 دریافت آمار چالش برای کاربر:', userId);
    
    // گرفتن آمار کاربر از دیتابیس
    const userStats = await sql`
      SELECT * FROM daily_challenge_scores WHERE user_id = ${userId}
    `;
    
    if (!userStats || userStats.length === 0) {
      console.log('📝 کاربر جدید در چالش:', userId);
      return NextResponse.json({ 
        success: true, 
        stats: {
          totalScore: 0,
          todayScore: 0,
          gamesPlayed: 0,
          averageScore: 0,
          rank: 0,
          totalPlayers: 0
        }
      });
    }
    
    const userData = userStats[0];
    
    // محاسبه رتبه کاربر
    const rankResult = await sql`
      SELECT COUNT(*) + 1 as rank
      FROM daily_challenge_scores 
      WHERE total_score > ${userData.total_score}
    `;
    
    // تعداد کل بازیکنان
    const totalPlayersResult = await sql`
      SELECT COUNT(*) as count FROM daily_challenge_scores
    `;
    const totalPlayers = totalPlayersResult[0]?.count || 0;
    
    const stats = {
      totalScore: userData.total_score,
      todayScore: userData.today_score,
      gamesPlayed: userData.games_played,
      averageScore: userData.games_played > 0 ? 
        Math.round(userData.total_score / userData.games_played) : 0,
      rank: rankResult[0]?.rank || 1,
      totalPlayers: totalPlayers,
      gameType: 'daily-challenge'
    };
    
    console.log('✅ آمار کاربر دریافت شد:', stats);
    
    return NextResponse.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('❌ خطا در دریافت آمار:', error);
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 });
  }
}