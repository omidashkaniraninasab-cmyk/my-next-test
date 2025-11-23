import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// 🔥 دریافت سوال روزانه
export async function GET() {
  try {
    console.log('🎯 دریافت سوال روزانه چالش...');
    
    // گرفتن همه سوالات
    const questions = await sql`
      SELECT id, text, letter, category, valid_answers 
      FROM daily_challenge_questions 
      ORDER BY id
    `;
    
    console.log(`📚 تعداد سوالات موجود: ${questions.length}`);
    
    if (questions.length === 0) {
      console.log('❌ هیچ سوالی در سیستم وجود ندارد');
      return NextResponse.json({ 
        success: false, 
        error: 'هیچ سوالی در سیستم وجود ندارد. لطفاً اول جداول را ایجاد کنید.' 
      }, { status: 404 });
    }
    
    // انتخاب سوال بر اساس روز ماه
    const today = new Date().getDate();
    const questionIndex = today % questions.length;
    const dailyQuestion = questions[questionIndex];
    
    console.log('📅 سوال انتخاب شده:', {
      index: questionIndex,
      total: questions.length,
      question: dailyQuestion.text
    });
    
    // تبدیل valid_answers به آرایه
    let validAnswers = dailyQuestion.valid_answers;
    if (typeof validAnswers === 'string') {
      try {
        validAnswers = JSON.parse(validAnswers);
      } catch (e) {
        console.error('❌ خطا در parse valid_answers:', e);
        validAnswers = [];
      }
    }
    
    const result = {
      success: true,
      question: {
        id: dailyQuestion.id,
        text: dailyQuestion.text,
        letter: dailyQuestion.letter,
        category: dailyQuestion.category,
        validAnswers: validAnswers
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ سوال آماده ارسال:', result.question.text);
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ خطا در دریافت سوال:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'خطای سرور در دریافت سوال' 
    }, { status: 500 });
  }
}

// 🔥 ذخیره پاسخ کاربر
export async function POST(request) {
  try {
    console.log('🎯 دریافت درخواست POST برای ثبت پاسخ...');
    
    const body = await request.json();
    console.log('📦 بدنه درخواست:', body);
    
    const { userId, answer, questionId } = body;
    
    if (!userId || !answer || !questionId) {
      console.log('❌ داده‌های ناقص:', { userId, answer, questionId });
      return NextResponse.json({ 
        success: false, 
        error: 'داده‌های ناقص' 
      }, { status: 400 });
    }
    
    // پیدا کردن سوال
    const questions = await sql`
      SELECT * FROM daily_challenge_questions WHERE id = ${questionId}
    `;
    
    if (!questions || questions.length === 0) {
      console.log('❌ سوال پیدا نشد:', questionId);
      return NextResponse.json({ 
        success: false, 
        error: 'سوال چالش پیدا نشد' 
      }, { status: 404 });
    }
    
    const question = questions[0];
    console.log('✅ سوال پیدا شد:', question.text);
    
    // پردازش valid_answers
    let validAnswers = question.valid_answers;
    if (typeof validAnswers === 'string') {
      try {
        validAnswers = JSON.parse(validAnswers);
      } catch (e) {
        console.error('❌ خطا در parse valid_answers:', e);
        validAnswers = [];
      }
    }
    
    const userAnswer = answer.trim();
    const isValid = Array.isArray(validAnswers) && validAnswers.includes(userAnswer);
    
    console.log('🔍 بررسی پاسخ:', {
      userAnswer,
      validAnswers,
      isValid
    });
    
    if (!isValid) {
      console.log('❌ پاسخ معتبر نیست');
      return NextResponse.json({ 
        success: false, 
        error: 'پاسخ معتبر نیست' 
      }, { status: 400 });
    }
    
    // محاسبه آمار پاسخ‌ها
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
    const totalAnswers = userCount + 1;
    
    let score = 100;
    if (totalAnswers === 1) score = 1000;
    else if (totalAnswers <= 10) score = 750;
    else if (totalAnswers <= 100) score = 500;
    else if (totalAnswers <= 1000) score = 250;
    
    console.log('📊 محاسبه امتیاز:', {
      userAnswer,
      userCount,
      totalAnswers,
      score
    });

    // گرفتن اطلاعات کاربر
    const userInfo = await sql`
      SELECT username, user_code, first_name, last_name 
      FROM user_profiles 
      WHERE id = ${userId}
    `;
    
    const user = userInfo[0];
    const username = user?.username || `user_${userId}`;
    const userCode = user?.user_code || `UC${userId}`;
    const displayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'کاربر';
    
    // ذخیره پاسخ
    await sql`
      INSERT INTO daily_challenge_answers 
        (user_id, question_id, answer, score, username, user_code, display_name)
      VALUES 
        (${userId}, ${questionId}, ${userAnswer}, ${score}, ${username}, ${userCode}, ${displayName})
    `;
    console.log('✅ پاسخ در دیتابیس ذخیره شد');
    
    // آپدیت یا ایجاد امتیاز کاربر
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
          username = ${username},
          user_code = ${userCode},
          display_name = ${displayName},
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
      `;
      console.log('✅ امتیاز کاربر آپدیت شد');
    } else {
      // ایجاد امتیاز جدید
      await sql`
        INSERT INTO daily_challenge_scores 
          (user_id, total_score, today_score, games_played, username, user_code, display_name)
        VALUES 
          (${userId}, ${score}, ${score}, 1, ${username}, ${userCode}, ${displayName})
      `;
      console.log('✅ امتیاز جدید کاربر ایجاد شد');
    }
    
    // گرفتن امتیاز نهایی
    const userScores = await sql`
      SELECT * FROM daily_challenge_scores WHERE user_id = ${userId}
    `;
    const userScore = userScores[0];
    
    console.log('🎉 عملیات با موفقیت完成 شد');
    
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
    return NextResponse.json({ 
      success: false, 
      error: 'خطای سرور در ثبت پاسخ',
      details: error.message 
    }, { status: 500 });
  }
}