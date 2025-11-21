import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || 'easy';
    
    console.log(`🎴 دریافت کارت‌های سطح: ${level}`);
    
    // گرفتن کارت‌ها از دیتابیس
    const cards = await sql`
      SELECT id, question, answer, category 
      FROM memory_game_cards 
      WHERE level = ${level}
      ORDER BY RANDOM()
      LIMIT 8
    `;
    
    if (cards.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'کارتی برای این سطح وجود ندارد' 
      }, { status: 404 });
    }
    
    console.log(`✅ ${cards.length} کارت دریافت شد`);
    
    // ایجاد لیست کارت‌های بازی
    let gameCards = [];
    cards.forEach(card => {
      // کارت سوال
      gameCards.push({
        id: `q-${card.id}`,
        type: 'question',
        content: card.question,
        pairId: `a-${card.id}`,
        category: card.category
      });
      // کارت جواب
      gameCards.push({
        id: `a-${card.id}`,
        type: 'answer', 
        content: card.answer,
        pairId: `q-${card.id}`,
        category: card.category
      });
    });
    
    // تصادفی کردن ترتیب کارت‌ها
    gameCards = gameCards.sort(() => Math.random() - 0.5);
    
    return NextResponse.json({
      success: true,
      level,
      cards: gameCards,
      totalPairs: cards.length
    });
    
  } catch (error) {
    console.error('❌ خطا در دریافت کارت‌ها:', error);
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId, level, moves, score, timeSpent } = await request.json();
    
    console.log('💾 ذخیره نتیجه بازی:', { userId, level, moves, score });
    
    if (!userId || !level) {
      return NextResponse.json({ 
        success: false, 
        error: 'داده‌های ناقص' 
      }, { status: 400 });
    }

    // 🔥 گرفتن اطلاعات کاربر برای فیلدهای جدید
    const userInfo = await sql`
      SELECT username, user_code, first_name, last_name 
      FROM user_profiles 
      WHERE id = ${userId}
    `;
    
    const user = userInfo[0];
    const username = user?.username || `user_${userId}`;
    const userCode = user?.user_code || `UC${userId}`;
    const displayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'کاربر';
    
    // 🔥 ذخیره در تاریخچه بازی با فیلدهای جدید
    await sql`
      INSERT INTO memory_game_history 
        (user_id, level, moves, score, time_spent, username, user_code, display_name)
      VALUES 
        (${userId}, ${level}, ${moves}, ${score}, ${timeSpent || 0}, ${username}, ${userCode}, ${displayName})
    `;
    
    // آپدیت یا ایجاد امتیاز کاربر
    const existingScores = await sql`
      SELECT * FROM memory_game_scores 
      WHERE user_id = ${userId} AND level = ${level}
    `;
    
    if (existingScores.length > 0) {
      // 🔥 آپدیت امتیاز موجود با فیلدهای جدید
      await sql`
        UPDATE memory_game_scores 
        SET 
          games_played = games_played + 1,
          total_score = total_score + ${score},
          best_score = GREATEST(best_score, ${score}),
          best_moves = LEAST(best_moves, ${moves}),
          username = ${username},
          user_code = ${userCode},
          display_name = ${displayName},
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId} AND level = ${level}
      `;
      console.log('✅ امتیاز کاربر آپدیت شد');
    } else {
      // 🔥 ایجاد امتیاز جدید با فیلدهای جدید
      await sql`
        INSERT INTO memory_game_scores 
          (user_id, level, best_score, best_moves, games_played, total_score, username, user_code, display_name)
        VALUES 
          (${userId}, ${level}, ${score}, ${moves}, 1, ${score}, ${username}, ${userCode}, ${displayName})
      `;
      console.log('✅ امتیاز جدید کاربر ایجاد شد');
    }
    
    return NextResponse.json({
      success: true,
      score,
      moves,
      message: 'نتیجه بازی ذخیره شد'
    });
    
  } catch (error) {
    console.error('❌ خطا در ذخیره نتیجه:', error);
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 });
  }
}