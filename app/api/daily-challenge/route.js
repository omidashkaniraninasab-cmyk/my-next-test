import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    console.log('🎯 دریافت سوال روزانه چالش...');
    
    // گرفتن سوال روز
    const today = new Date().getDate();
    const questions = await sql`
      SELECT * FROM daily_challenge_questions 
      ORDER BY id
    `;
    
    if (questions.length === 0) {
      return NextResponse.json({ success: false, error: 'هیچ سوالی در سیستم وجود ندارد' }, { status: 404 });
    }
    
    const questionIndex = today % questions.length;
    const dailyQuestion = questions[questionIndex];
    
    console.log('✅ سوال روزانه دریافت شد:', dailyQuestion.id);
    
    return NextResponse.json({
      success: true,
      question: {
        id: dailyQuestion.id,
        text: dailyQuestion.text,
        letter: dailyQuestion.letter,
        category: dailyQuestion.category,
        validAnswers: dailyQuestion.valid_answers
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ خطا در دریافت سوال:', error);
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId, answer, questionId } = await request.json();
    
    console.log('🎯 ثبت پاسخ چالش:', { userId, questionId, answer });
    
    if (!userId || !answer || !questionId) {
      return NextResponse.json({ success: false, error: 'داده‌های ناقص' }, { status: 400 });
    }
    
    // پیدا کردن سوال و پاسخ‌های معتبر
    const questions = await sql`
      SELECT * FROM daily_challenge_questions WHERE id = ${questionId}
    `;
    
    if (!questions || questions.length === 0) {
      return NextResponse.json({ success: false, error: 'سوال چالش پیدا نشد' }, { status: 404 });
    }
    
    const question = questions[0];
    const validAnswers = question.valid_answers;
    const userAnswer = answer.trim();
    
    const isValid = validAnswers.includes(userAnswer);
    
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'پاسخ معتبر نیست' }, { status: 400 });
    }
    
    // محاسبه آمار پاسخ‌ها برای این سوال
    const answerStats = await sql`
      SELECT answer, COUNT(*) as count 
      FROM daily_challenge_answers 
      WHERE question_id = ${questionId} 
      GROUP BY answer
    `;
    
    const stats = {};
    answerStats.forEach(row => {
      stats[row.answer] = parseInt(row.count);
    });
    
    // محاسبه امتیاز
    const userCount = stats[userAnswer] || 0;
    const totalAnswers = userCount + 1; // +1 برای پاسخ فعلی
    
    let score = 100;
    if (totalAnswers === 1) score = 1000;
    else if (totalAnswers <= 10) score = 750;
    else if (totalAnswers <= 100) score = 500;
    else if (totalAnswers <= 1000) score = 250;
    
    console.log('📊 آمار پاسخ:', { userAnswer, userCount, totalAnswers, score });
    
    // استفاده از تراکنش برای عملیات دیتابیس
    await sql.begin(async (sql) => {
      // ذخیره پاسخ کاربر
      await sql`
        INSERT INTO daily_challenge_answers (user_id, question_id, answer, score)
        VALUES (${userId}, ${questionId}, ${userAnswer}, ${score})
      `;
      
      // بررسی وجود کاربر در جدول امتیازات
      const existingScores = await sql`
        SELECT * FROM daily_challenge_scores WHERE user_id = ${userId}
      `;
      
      if (existingScores.length > 0) {
        // آپدیت امتیاز موجود
        await sql`
          UPDATE daily_challenge_scores 
          SET 
            total_score = total_score + ${score},
            today_score = today_score + ${score},
            games_played = games_played + 1,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${userId}
        `;
        console.log('✅ امتیاز کاربر آپدیت شد');
      } else {
        // ایجاد امتیاز جدید
        await sql`
          INSERT INTO daily_challenge_scores (user_id, total_score, today_score, games_played)
          VALUES (${userId}, ${score}, ${score}, 1)
        `;
        console.log('✅ امتیاز جدید کاربر ایجاد شد');
      }
    });
    
    // گرفتن امتیاز نهایی کاربر
    const userScores = await sql`
      SELECT * FROM daily_challenge_scores WHERE user_id = ${userId}
    `;
    
    const userScore = userScores[0];
    
    console.log('🎉 پاسخ با موفقیت ثبت شد:', {
      userId,
      score,
      totalScore: userScore.total_score,
      todayScore: userScore.today_score
    });
    
    return NextResponse.json({
      success: true,
      score,
      userCount: totalAnswers,
      totalScore: userScore.total_score,
      todayScore: userScore.today_score,
      gamesPlayed: userScore.games_played,
      message: 'پاسخ در چالش ثبت شد'
    });
    
  } catch (error) {
    console.error('❌ خطا در ثبت پاسخ:', error);
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 });
  }
}