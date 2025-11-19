import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    console.log('🚀 شروع فرآیند ایجاد جداول چالش روزانه...');
    
    // 1. ایجاد جدول سوالات
    console.log('📋 ایجاد جدول سوالات...');
    await sql`
      CREATE TABLE IF NOT EXISTS daily_challenge_questions (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        letter VARCHAR(10) NOT NULL,
        category VARCHAR(100) NOT NULL,
        valid_answers JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ جدول daily_challenge_questions ایجاد شد');

    // 2. ایجاد جدول امتیازات
    console.log('📊 ایجاد جدول امتیازات...');
    await sql`
      CREATE TABLE IF NOT EXISTS daily_challenge_scores (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL UNIQUE,
        total_score INTEGER DEFAULT 0,
        today_score INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ جدول daily_challenge_scores ایجاد شد');

    // 3. ایجاد جدول پاسخ‌ها
    console.log('💬 ایجاد جدول پاسخ‌ها...');
    await sql`
      CREATE TABLE IF NOT EXISTS daily_challenge_answers (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        question_id INTEGER REFERENCES daily_challenge_questions(id),
        answer TEXT NOT NULL,
        score INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ جدول daily_challenge_answers ایجاد شد');

    // 4. بررسی دقیق وجود سوالات
    console.log('🔍 بررسی سوالات موجود...');
    const existingQuestions = await sql`
      SELECT id, text FROM daily_challenge_questions
    `;
    
    console.log(`📚 تعداد سوالات موجود: ${existingQuestions.length}`);
    
    if (existingQuestions.length === 0) {
      console.log('📝 در حال اضافه کردن سوالات اولیه...');
      
      // تعریف سوالات - با فرمت ساده‌تر
      const questions = [
        {
          text: "با حرف 'ب' اسم دخترانه بسازید",
          letter: "ب",
          category: "اسم دخترانه",
          valid_answers: ["بیتا", "بهار", "باران", "بهناز", "بدری", "پریسا", "پگاه", "بنفشه", "بهشت", "بیدا"]
        },
        {
          text: "با حرف 'آ' اسم پسرانه بسازید", 
          letter: "آ",
          category: "اسم پسرانه", 
          valid_answers: ["آرش", "آرمان", "آرین", "آبتین", "آذر", "آراد", "آرمین"]
        },
        {
          text: "با حرف 'م' میوه نام ببرید",
          letter: "م",
          category: "میوه",
          valid_answers: ["موز", "مشمش", "ملون", "مانگو", "میوه"]
        }
      ];

      // درج سوالات با await جداگانه
      let insertedCount = 0;
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        try {
          await sql`
            INSERT INTO daily_challenge_questions (text, letter, category, valid_answers)
            VALUES (${question.text}, ${question.letter}, ${question.category}, ${JSON.stringify(question.valid_answers)})
          `;
          insertedCount++;
          console.log(`✅ سوال ${i + 1} اضافه شد: ${question.text}`);
        } catch (insertError) {
          console.error(`❌ خطا در درج سوال ${i + 1}:`, insertError);
        }
      }
      
      console.log(`🎉 ${insertedCount} سوال اضافه شد`);
    } else {
      console.log('ℹ️ سوالات از قبل موجود هستند:');
      existingQuestions.forEach((q, index) => {
        console.log(`  ${index + 1}. ID: ${q.id} - ${q.text}`);
      });
    }

    // 5. تأیید نهایی
    console.log('🔎 تأیید نهایی...');
    const finalCheck = await sql`
      SELECT id, text, letter FROM daily_challenge_questions
    `;
    
    const scoresCheck = await sql`
      SELECT COUNT(*) as count FROM daily_challenge_scores
    `;
    
    console.log('📋 نتیجه نهایی:');
    console.log(`   - سوالات: ${finalCheck.length} مورد`);
    console.log(`   - کاربران: ${scoresCheck[0].count} مورد`);
    
    return NextResponse.json({
      success: true,
      message: 'جداول چالش روزانه با موفقیت ایجاد و راه‌اندازی شدند',
      questionsCount: finalCheck.length,
      questions: finalCheck,
      usersCount: parseInt(scoresCheck[0].count)
    });
    
  } catch (error) {
    console.error('❌ خطا در ایجاد جداول:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}