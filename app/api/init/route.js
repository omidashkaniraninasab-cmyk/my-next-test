import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET() {
  try {
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
    
    return Response.json({ 
      success: true,
      message: '✅ جدول پروفایل کاربر ایجاد شد'
    });
    
  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message
    }, { status: 500 });
  }
}