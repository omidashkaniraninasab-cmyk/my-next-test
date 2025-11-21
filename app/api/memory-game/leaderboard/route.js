import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  let result;
  try {
    console.log('🎮 دریافت رتبه‌بندی بازی حافظه...');
    
    // تست ساده‌ترین کوئری ممکن
    console.log('🔍 اجرای کوئری تست...');
    result = await sql`SELECT 1 as test`;
    console.log('✅ تست دیتابیس موفق:', result);
    
    // کوئری اصلی
    console.log('🔍 اجرای کوئری اصلی...');
    result = await sql`
      SELECT 
        user_id,
        username,
        display_name,
        total_score
      FROM memory_game_scores 
      LIMIT 5
    `;
    
    console.log('📊 نتیجه کوئری اصلی:', {
      length: result?.length,
      data: result
    });
    
    if (!result || result.length === 0) {
      console.log('ℹ️ هیچ داده‌ای پیدا نشد');
      return NextResponse.json({ 
        success: true,
        leaderboard: [],
        debug: 'no_data_found'
      });
    }
    
    // تبدیل ساده
    const leaderboard = result.map((user, index) => ({
      rank: index + 1,
      userId: String(user.user_id),
      username: user.username || 'user',
      displayName: user.display_name || 'کاربر',
      totalScore: user.total_score || 0
    }));
    
    console.log('✅ لیست نهایی:', leaderboard);
    
    return NextResponse.json({
      success: true,
      leaderboard: leaderboard,
      debug: 'success'
    });
    
  } catch (error) {
    console.error('❌ خطای کامل:', error);
    console.error('🔍 جزئیات خطا:', {
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json({ 
      success: true,
      leaderboard: [],
      debug: 'error',
      error: error.message
    });
  }
}