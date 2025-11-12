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
      instant_crossword_score INTEGER DEFAULT 0,
      last_score_reset_date DATE DEFAULT CURRENT_DATE  -- فیلد جدید برای پیگیری تاریخ ریست
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
  try {
    await sql`
      UPDATE user_profiles 
      SET today_login_time = CURRENT_TIMESTAMP 
      WHERE id = ${userId}
    `;
    console.log('✅ Login time updated for user:', userId);
  } catch (error) {
    console.error('Error updating login time:', error);
  }
}

// آپدیت زمان خروج
export async function updateLogoutTime(userId) {
  try {
    await sql`
      UPDATE user_profiles 
      SET today_logout_time = CURRENT_TIMESTAMP 
      WHERE id = ${userId}
    `;
    console.log('✅ Logout time updated for user:', userId);
  } catch (error) {
    console.error('Error updating logout time:', error);
  }
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
  await createCrosswordGamesTable();
  
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
export async function updateUserScore(userId, todayScore, totalScore) {
  await sql`
    UPDATE user_profiles 
    SET 
      today_crossword_score = COALESCE(today_crossword_score, 0) + ${todayScore},
      total_crossword_score = COALESCE(total_crossword_score, 0) + ${totalScore},
      crossword_games_played = COALESCE(crossword_games_played, 0) + 1
    WHERE id = ${userId}
  `;
}

// محاسبه و آپدیت رتبه همه کاربران
export async function updateUserRanks() {
  try {
    console.log('🔢 Calculating user ranks...');
    
    // گرفتن همه کاربران مرتب شده بر اساس امتیاز
    const users = await sql`
      SELECT id, total_crossword_score 
      FROM user_profiles 
      ORDER BY total_crossword_score DESC NULLS LAST
    `;

    console.log(`📊 Found ${users.length} users`);

    // آپدیت رتبه هر کاربر
    for (let i = 0; i < users.length; i++) {
      const rank = users[i].total_crossword_score > 0 ? i + 1 : 0;
      await sql`
        UPDATE user_profiles 
        SET crossword_rank = ${rank}
        WHERE id = ${users[i].id}
      `;
    }

    console.log(`✅ Ranks updated for ${users.length} users`);
    return users.length;
  } catch (error) {
    console.error('❌ Error updating ranks:', error);
    throw error;
  }
}

// محاسبه رتبه یک کاربر خاص
export async function getUserRank(userId) {
  try {
    const userRank = await sql`
      SELECT COUNT(*) + 1 as rank
      FROM user_profiles 
      WHERE total_crossword_score > (
        SELECT total_crossword_score 
        FROM user_profiles 
        WHERE id = ${userId}
      )
    `;

    return parseInt(userRank[0].rank);
  } catch (error) {
    console.error('Error getting user rank:', error);
    return 0;
  }
}

// ایجاد جدول تاریخچه بازی‌ها
export async function createGameHistoryTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS game_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES user_profiles(id),
      game_id INTEGER REFERENCES crossword_games(id),
      puzzle_title VARCHAR(200) NOT NULL,
      puzzle_size INTEGER NOT NULL,
      score INTEGER NOT NULL,
      mistakes INTEGER NOT NULL,
      completion_time INTEGER, -- زمان تکمیل به ثانیه
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

// ذخیره بازی در تاریخچه
export async function saveGameToHistory(userId, gameId, puzzleData, score, mistakes, completionTime = null) {
  await createGameHistoryTable();
  
  const result = await sql`
    INSERT INTO game_history (
      user_id, game_id, puzzle_title, puzzle_size, score, mistakes, completion_time
    ) 
    VALUES (
      ${userId}, ${gameId}, ${puzzleData.title}, ${puzzleData.size}, 
      ${score}, ${mistakes}, ${completionTime}
    )
    RETURNING *
  `;
  return result[0];
}

// گرفتن تاریخچه بازی‌های کاربر
export async function getUserGameHistory(userId, limit = 10) {
  const history = await sql`
    SELECT 
      gh.*,
      cg.started_at,
      cg.completed_at,
      EXTRACT(EPOCH FROM (cg.completed_at - cg.started_at)) as play_duration
    FROM game_history gh
    LEFT JOIN crossword_games cg ON gh.game_id = cg.id
    WHERE gh.user_id = ${userId}
    ORDER BY gh.created_at DESC
    LIMIT ${limit}
  `;
  return history;
}


// ایجاد جدول جدول‌های روزانه
export async function createDailyPuzzlesTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS daily_puzzles (
      id SERIAL PRIMARY KEY,
      date DATE UNIQUE NOT NULL,
      puzzle_data JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE
    )
  `;
  console.log('✅ Daily puzzles table created or already exists');
}

// تابع جدید برای ریست امتیازهای امروز همه کاربران
export async function resetDailyScores() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await sql`
      UPDATE user_profiles 
      SET 
        today_crossword_score = 0,
        last_score_reset_date = ${today}
      WHERE last_score_reset_date IS NULL OR last_score_reset_date < ${today}
    `;
    
    console.log(`✅ Daily scores reset for ${result.count} users`);
    return result.count;
  } catch (error) {
    console.error('Error resetting daily scores:', error);
    throw error;
  }
}