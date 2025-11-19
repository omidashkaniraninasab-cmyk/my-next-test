import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    console.log('🎴 شروع ایجاد جداول بازی کارت حافظه...');
    
    // ۱. جدول کارت‌های بازی
    await sql`
      CREATE TABLE IF NOT EXISTS memory_game_cards (
        id SERIAL PRIMARY KEY,
        level VARCHAR(20) NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ جدول memory_game_cards ایجاد شد');
    
    // ۲. جدول امتیازات کاربران
    await sql`
      CREATE TABLE IF NOT EXISTS memory_game_scores (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        level VARCHAR(20) NOT NULL,
        best_score INTEGER DEFAULT 0,
        best_moves INTEGER DEFAULT 999,
        games_played INTEGER DEFAULT 0,
        total_score INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, level)
      )
    `;
    console.log('✅ جدول memory_game_scores ایجاد شد');
    
    // ۳. جدول تاریخچه بازی‌ها
    await sql`
      CREATE TABLE IF NOT EXISTS memory_game_history (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        level VARCHAR(20) NOT NULL,
        moves INTEGER NOT NULL,
        score INTEGER NOT NULL,
        time_spent INTEGER DEFAULT 0,
        played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ جدول memory_game_history ایجاد شد');
    
    // ۴. ایجاد ایندکس‌ها
    await sql`
      CREATE INDEX IF NOT EXISTS idx_memory_scores_user_id 
      ON memory_game_scores(user_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_memory_history_user_id 
      ON memory_game_history(user_id)
    `;
    console.log('✅ ایندکس‌ها ایجاد شدند');
    
    // ۵. اضافه کردن کارت‌های سطح آسان
    const existingCards = await sql`
      SELECT COUNT(*) as count FROM memory_game_cards WHERE level = 'easy'
    `;
    
    if (parseInt(existingCards[0].count) === 0) {
      console.log('📝 اضافه کردن کارت‌های سطح آسان...');
      
      const easyCards = [
        { question: "پایتخت ایران", answer: "تهران", category: "جغرافیا" },
        { question: "رنگ آسمان", answer: "آبی", category: "طبیعت" },
        { question: "مادر پدر", answer: "والدین", category: "خانواده" },
        { question: "برادر خواهر", answer: "خواهر و برادر", category: "خانواده" },
        { question: "میوه قرمز", answer: "سیب", category: "میوه‌ها" },
        { question: "حیوان خانگی", answer: "سگ", category: "حیوانات" },
        { question: "فصل برف", answer: "زمستان", category: "فصول" },
        { question: "وسیله نقلیه", answer: "ماشین", category: "وسایل" },
        { question: "رنگ پرچم ایران", answer: "سبز", category: "ملی" },
        { question: "شیرینی ایرانی", answer: "باقلوا", category: "غذا" },
        { question: "پایتخت فرانسه", answer: "پاریس", category: "جغرافیا" },
        { question: "سیاره قرمز", answer: "مریخ", category: "نجوم" },
        { question: "دریای شمال ایران", answer: "خزر", category: "جغرافیا" },
        { question: "عدد اول", answer: "دو", category: "ریاضی" },
        { question: "رنگ خورشید", answer: "زرد", category: "طبیعت" },
        { question: "حیوان دریا", answer: "ماهی", category: "حیوانات" }
      ];
      
      for (const card of easyCards) {
        await sql`
          INSERT INTO memory_game_cards (level, question, answer, category)
          VALUES ('easy', ${card.question}, ${card.answer}, ${card.category})
        `;
      }
      
      console.log(`✅ ${easyCards.length} کارت اضافه شد`);
    }
    
    console.log('🎉 جداول بازی کارت حافظه ایجاد شدند');
    
    return NextResponse.json({
      success: true,
      message: 'جداول بازی کارت حافظه با موفقیت ایجاد شدند'
    });
    
  } catch (error) {
    console.error('❌ خطا در ایجاد جداول:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}