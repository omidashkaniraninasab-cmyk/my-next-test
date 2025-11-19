import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const level = searchParams.get('level') || 'easy';
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });
    }
    
    console.log(`📊 دریافت آمار کاربر: ${userId} (سطح: ${level})`);
    
    // گرفتن آمار کاربر از دیتابیس
    const userStats = await sql`
      SELECT * FROM memory_game_scores 
      WHERE user_id = ${userId} AND level = ${level}
    `;
    
    console.log('📋 نتیجه کوئری آمار:', userStats);
    
    if (userStats.length === 0) {
      console.log('📝 کاربر هنوز بازی نکرده است');
      return NextResponse.json({ 
        success: true, 
        stats: {
          bestScore: 0,
          bestMoves: 0,
          gamesPlayed: 0,
          totalScore: 0,
          averageScore: 0
        }
      });
    }
    
    const stats = userStats[0];
    const averageScore = stats.games_played > 0 ? 
      Math.round(stats.total_score / stats.games_played) : 0;
    
    const result = {
      bestScore: stats.best_score || 0,
      bestMoves: stats.best_moves || 0,
      gamesPlayed: stats.games_played || 0,
      totalScore: stats.total_score || 0,
      averageScore: averageScore
    };
    
    console.log('✅ آمار کاربر:', result);
    
    return NextResponse.json({
      success: true,
      stats: result
    });
    
  } catch (error) {
    console.error('❌ خطا در دریافت آمار:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'خطای سرور در دریافت آمار' 
    }, { status: 500 });
  }
}