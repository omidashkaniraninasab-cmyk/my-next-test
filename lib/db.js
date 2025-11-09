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


// توابع موجود قبلی رو نگه دار و اینها رو اضافه کن:

// ایجاد جدول بازی‌های کراسورد
export async function createCrosswordGamesTable() {
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
}

// ایجاد بازی جدید
export async function createNewGame(userId, puzzleData) {
  const result = await sql`
    INSERT INTO crossword_games (user_id, puzzle_data, user_progress, started_at)
    VALUES (${userId}, ${JSON.stringify(puzzleData)}, ${JSON.stringify({})}, CURRENT_TIMESTAMP)
    RETURNING *
  `;
  return result[0];
}

// آپدیت پیشرفت بازی
export async function updateGameProgress(gameId, progress, score, mistakes) {
  await sql`
    UPDATE crossword_games 
    SET user_progress = ${JSON.stringify(progress)}, score = ${score}, mistakes = ${mistakes}
    WHERE id = ${gameId}
  `;
}

// تکمیل بازی
export async function completeGame(gameId, finalScore) {
  await sql`
    UPDATE crossword_games 
    SET completed = TRUE, score = ${finalScore}, completed_at = CURRENT_TIMESTAMP, finished_at = CURRENT_TIMESTAMP
    WHERE id = ${gameId}
  `;
}

// آپدیت امتیاز کاربر
// آپدیت امتیاز کاربر با مدیریت NULL
export async function updateUserScore(userId, todayScore, totalScore) {
  await sql`
    UPDATE user_profiles 
    SET 
      today_crossword_score = COALESCE(today_crossword_score, 0) + ${todayScore},
      total_crossword_score = COALESCE(total_crossword_score, 0) + ${totalScore},
      crossword_games_played = COALESCE(crossword_games_played, 0) + 1,
      completed_crossword_games = COALESCE(completed_crossword_games, 0),
      incomplete_crossword_games = COALESCE(incomplete_crossword_games, 0)
    WHERE id = ${userId}
  `;
}