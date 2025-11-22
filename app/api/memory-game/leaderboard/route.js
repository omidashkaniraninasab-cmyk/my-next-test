import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    console.log('🏆 دریافت رتبه‌بندی بازی کارت...');
    
    // اول فقط user_id و display_name رو بگیریم
    const testQuery = await sql`
      SELECT user_id, display_name
      FROM memory_game_scores 
      LIMIT 5
    `;
    
    console.log('🔍 تست فیلد display_name:', testQuery);
    
    // اگر تست کار کرد، کل query رو اجرا کنیم
    const leaderboard = await sql`
      SELECT 
        user_id,
        display_name,
        level,
        best_score,
        best_moves,
        games_played,
        total_score
      FROM memory_game_scores 
      WHERE best_score > 0
      ORDER BY best_score DESC, best_moves ASC
      LIMIT 50
    `;
    
    console.log('📊 داده‌های دریافت شده:', leaderboard);
    
    const leaderboardWithRanks = leaderboard.map((user, index) => ({
      rank: index + 1,
      userId: user.user_id,
      displayName: user.display_name || `User${user.user_id}`,
      level: user.level,
      bestScore: user.best_score,
      bestMoves: user.best_moves,
      gamesPlayed: user.games_played,
      totalScore: user.total_score,
      bestTime: user.best_moves
    }));
    
    return NextResponse.json({
      success: true,
      leaderboard: leaderboardWithRanks
    });
    
  } catch (error) {
    console.error('❌ خطا در دریافت رتبه‌بندی:', error);
    console.error('📌 جزئیات خطا:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: 'خطای سرور در دریافت رتبه‌بندی' 
    }, { status: 500 });
  }
}