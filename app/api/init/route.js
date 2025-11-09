import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET() {
  try {
    console.log('Starting database initialization...');

    // ایجاد جدول پروفایل کاربر
    await sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        today_login_time TIMESTAMP,
        today_logout_time TIMESTAMP,
        today_crossword_score INTEGER DEFAULT 0,
        total_crossword_score INTEGER DEFAULT 0,
        crossword_games_played INTEGER DEFAULT 0,
        crossword_rank INTEGER DEFAULT 0,
        incomplete_crossword_games INTEGER DEFAULT 0,
        completed_crossword_games INTEGER DEFAULT 0,
        bank_card_number VARCHAR(20),
        instant_crossword_score INTEGER DEFAULT 0
      )
    `;
    console.log('✅ user_profiles table created/verified');

    // ایجاد جدول بازی‌های کراسورد
    await sql`
      CREATE TABLE IF NOT EXISTS crossword_games (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES user_profiles(id),
        puzzle_data JSONB NOT NULL,
        user_progress JSONB NOT NULL,
        score INTEGER DEFAULT 0,
        mistakes INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP
      )
    `;
    console.log('✅ crossword_games table created/verified');

    return Response.json({ 
      success: true,
      message: '✅ جدول پروفایل کاربر و بازی‌های کراسورد ایجاد شد'
    });
    
  } catch (error) {
    console.error('Init error:', error);
    return Response.json({ 
      success: false,
      error: error.message
    }, { status: 500 });
  }
}