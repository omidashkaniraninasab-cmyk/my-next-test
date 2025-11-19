import { sql } from '@neondatabase/serverless';

export async function initDailyChallenge() {
  try {
    const db = sql(process.env.DATABASE_URL);
    
    console.log('🎯 شروع ایجاد جداول چالش روزانه...');
    
    // ایجاد جدول سوالات
    await db`
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
    
    // ایجاد جدول امتیازات
    await db`
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
    
    // ایجاد جدول پاسخ‌ها
    await db`
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
    
    // ایجاد ایندکس‌ها
    await db`
      CREATE INDEX IF NOT EXISTS idx_daily_challenge_scores_user_id 
      ON daily_challenge_scores(user_id)
    `;
    console.log('✅ ایندکس scores ایجاد شد');
    
    await db`
      CREATE INDEX IF NOT EXISTS idx_daily_challenge_answers_user_id 
      ON daily_challenge_answers(user_id)
    `;
    console.log('✅ ایندکس answers user ایجاد شد');
    
    await db`
      CREATE INDEX IF NOT EXISTS idx_daily_challenge_answers_question_id 
      ON daily_challenge_answers(question_id)
    `;
    console.log('✅ ایندکس answers question ایجاد شد');
    
    // بررسی وجود سوالات
    const existingQuestions = await db`
      SELECT COUNT(*) as count FROM daily_challenge_questions
    `;
    
    if (existingQuestions[0].count === 0) {
      console.log('📝 در حال اضافه کردن سوالات اولیه...');
      
      await db`
        INSERT INTO daily_challenge_questions (text, letter, category, valid_answers) VALUES
        ('با حرف ''ب'' اسم دخترانه بسازید', 'ب', 'اسم دخترانه', 
         '["بیتا", "بهار", "باران", "بهناز", "بدری", "پریسا", "پگاه", "بنفشه", "بهشت", "بیدا"]'),
        
        ('با حرف ''آ'' اسم پسرانه بسازید', 'آ', 'اسم پسرانه',
         '["آرش", "آرمان", "آرین", "آبتین", "آذر", "آراد", "آرمین"]'),
         
        ('با حرف ''م'' میوه نام ببرید', 'م', 'میوه',
         '["موز", "مشمش", "ملون", "مانگو", "میوه"]'),
         
        ('با حرف ''ر'' شهر ایران نام ببرید', 'ر', 'شهر ایران',
         '["رشت", "رودهن", "رفسنجان", "رامهرمز", "راین", "رویان"]'),
         
        ('با حرف ''ش'' حیوان نام ببرید', 'ش', 'حیوان',
         '["شیر", "شتر", "شغال", "شاهین", "شمشیرماهی"]')
      `;
      
      console.log('✅ سوالات اولیه اضافه شدند');
    } else {
      console.log(`📊 ${existingQuestions[0].count} سوال موجود است`);
    }
    
    console.log('🎉 ایجاد جداول چالش روزانه با موفقیت انجام شد');
    
  } catch (error) {
    console.error('❌ خطا در ایجاد جداول چالش:', error);
    throw error;
  }
}