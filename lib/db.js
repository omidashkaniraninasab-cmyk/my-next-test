import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// ایجاد جدول پروفایل کاربر با فیلدهای جدید
export async function createUserProfileTable() {
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
}

// ایجاد کاربر جدید
export async function createUserProfile(userData) {
  const {
    username,
    email,
    password,
    firstName,
    lastName,
    bankCardNumber
  } = userData;

  const result = await sql`
    INSERT INTO user_profiles (
      username, email, password, first_name, last_name, bank_card_number
    ) 
    VALUES (
      ${username}, ${email}, ${password}, ${firstName}, ${lastName}, ${bankCardNumber}
    )
    RETURNING *
  `;
  return result[0];
}

// گرفتن همه کاربران
export async function getUserProfiles() {
  const users = await sql`SELECT * FROM user_profiles ORDER BY registration_date DESC`;
  return users;
}

// آپدیت زمان ورود
export async function updateLoginTime(userId) {
  await sql`
    UPDATE user_profiles 
    SET today_login_time = CURRENT_TIMESTAMP 
    WHERE id = ${userId}
  `;
}

// آپدیت زمان خروج
export async function updateLogoutTime(userId) {
  await sql`
    UPDATE user_profiles 
    SET today_logout_time = CURRENT_TIMESTAMP 
    WHERE id = ${userId}
  `;
}

// آپدیت امتیاز کراسورد
export async function updateCrosswordScore(userId, todayScore, totalScore) {
  await sql`
    UPDATE user_profiles 
    SET 
      today_crossword_score = ${todayScore},
      total_crossword_score = ${totalScore},
      crossword_games_played = crossword_games_played + 1
    WHERE id = ${userId}
  `;
}