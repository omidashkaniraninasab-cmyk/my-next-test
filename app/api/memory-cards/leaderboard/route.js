import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    console.log('🏆 دریافت رتبه‌بندی بازی کارت...');
    
    const leaderboard = await sql`
      SELECT 
        user_id,
        level,
        best_score,
        best_moves,
        games_played,
        total_score,
        created_at
      FROM memory_game_scores 
      WHERE best_score > 0
      ORDER BY best_score DESC, best_moves ASC
      LIMIT 50
    `;
    
    const leaderboardWithRanks = leaderboard.map((user, index) => ({
      rank: index + 1,
      userId: user.user_id,
      displayName: `User${user.user_id}`, // نمایش ساده
      level: user.level,
      bestScore: user.best_score,
      bestMoves: user.best_moves,
      gamesPlayed: user.games_played,
      totalScore: user.total_score,
      bestTime: user.best_moves
    }));
    
    console.log(`✅ ${leaderboardWithRanks.length} کاربر در رتبه‌بندی`);
    
    return NextResponse.json({
      success: true,
      leaderboard: leaderboardWithRanks,
      gameType: 'memory-cards',
      totalPlayers: leaderboardWithRanks.length,
      updatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ خطا در دریافت رتبه‌بندی:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'خطای سرور در دریافت رتبه‌بندی' 
    }, { status: 500 });
  }
}