// ...existing code...
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// ایجاد جدول پروفایل کاربر با فیلدهای جدید
export async function createUserProfileTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(200) NOT NULL,
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
      last_score_reset_date DATE DEFAULT CURRENT_DATE,
      today_game_completed BOOLEAN DEFAULT FALSE
    )
  `;
}

// ایجاد کاربر جدید با بررسی duplicate
export async function createUserProfile(userData) {
  const {
    username,
    email,
    password,
    firstName,
    lastName,
    bankCardNumber
  } = userData;

  try {
    // بررسی وجود username یا email تکراری
    const existing = await sql`
      SELECT id FROM user_profiles
      WHERE email = ${email} OR username = ${username}
      LIMIT 1
    `;
    if (existing.length > 0) {
      const err = new Error('duplicate');
      err.code = '23505';
      throw err;
    }

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
  } catch (error) {
    // پاس دادن خطای duplicate برای مدیریت در لایهٔ بالاتر
    throw error;
  }
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
    throw error;
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
    throw error;
  }
}

// آپدیت امتیاز کراسورد (برای افزایش پس از پایان بازی)
export async function updateCrosswordScore(userId, todayScore, totalScore) {
  await sql`
    UPDATE user_profiles 
    SET 
      today_crossword_score = COALESCE(today_crossword_score, 0) + ${todayScore},
      total_crossword_score = COALESCE(total_crossword_score, 0) + ${totalScore},
      crossword_games_played = COALESCE(crossword_games_played, 0) + 1
    WHERE id = ${userId}
  `;
}

// ایجاد جدول بازی‌های کراسورد
export async function createCrosswordGamesTableMain() {
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
      finished_at TIMESTAMP,
      started_marked BOOLEAN DEFAULT FALSE
    )
  `;
  console.log('✅ crossword_games table created or already exists');
}

// ایجاد بازی جدید با cast صحیح به JSONB
export async function createNewGame(userId, puzzleData) {
  await createCrosswordGamesTableMain();
  await addStartedMarkedColumn(); // این خط رو اضافه کن
  try {
    const result = await sql`
      INSERT INTO crossword_games (user_id, puzzle_data, user_progress, started_at)
      VALUES (
        ${userId},
        ${JSON.stringify(puzzleData)}::jsonb,
        ${JSON.stringify({})}::jsonb,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error('Error creating new game:', error);
    throw error;
  }
}

// آپدیت پیشرفت بازی با cast به JSONB و بازگرداندن ردیف آپدیت شده
export async function updateGameProgress(gameId, progress, score, mistakes) {
  try {
    const result = await sql`
      UPDATE crossword_games 
      SET user_progress = ${JSON.stringify(progress)}::jsonb, score = ${score}, mistakes = ${mistakes}
      WHERE id = ${gameId}
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error('Error updating game progress:', error);
    throw error;
  }
}

// تکمیل بازی با ذخیره زمان تکمیل
export async function completeGame(gameId, finalScore) {
  try {
    const result = await sql`
      UPDATE crossword_games 
      SET completed = TRUE, score = ${finalScore}, completed_at = CURRENT_TIMESTAMP, finished_at = CURRENT_TIMESTAMP
      WHERE id = ${gameId}
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error('Error completing game:', error);
    throw error;
  }
}

// آپدیت امتیاز کاربر (افزایش مقادیر)
export async function updateUserScore(userId, todayScore, totalScore) {
  try {
    const result = await sql`
      UPDATE user_profiles 
      SET 
        today_crossword_score = COALESCE(today_crossword_score, 0) + ${todayScore},
        total_crossword_score = COALESCE(total_crossword_score, 0) + ${totalScore},
        crossword_games_played = COALESCE(crossword_games_played, 0) + 1
      WHERE id = ${userId}
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error('Error updating user score:', error);
    throw error;
  }
}

// محاسبه و آپدیت رتبه همه کاربران
export async function updateUserRanks() {
  try {
    console.log('🔢 Calculating user ranks...');
    
    const users = await sql`
      SELECT id, total_crossword_score 
      FROM user_profiles 
      ORDER BY total_crossword_score DESC NULLS LAST
    `;

    console.log(`📊 Found ${users.length} users`);

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
    return parseInt(userRank[0].rank, 10) || 0;
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
      completion_time INTEGER,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

// ذخیره بازی در تاریخچه
export async function saveGameToHistory(userId, gameId, puzzleData, score, mistakes, completionTime = null) {
  await createGameHistoryTable();
  try {
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
  } catch (error) {
    console.error('Error saving game to history:', error);
    throw error;
  }
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

// تابع برای ریست وضعیت بازی روزانه — برمی‌گرداند تعداد کاربرانی که ریست شده‌اند
export async function resetDailyScores() {
  try {
    const result = await sql`
      UPDATE user_profiles 
      SET 
        today_crossword_score = 0,
        today_game_completed = FALSE,
        last_score_reset_date = CURRENT_DATE
      WHERE last_score_reset_date IS NULL OR last_score_reset_date < CURRENT_DATE
      RETURNING id
    `;
    
    const count = Array.isArray(result) ? result.length : 0;
    console.log(`✅ Daily scores and game status reset for ${count} users`);
    return count;
  } catch (error) {
    console.error('Error resetting daily scores:', error);
    throw error;
  }
}

// در lib/db.js - این تابع رو اضافه کن
export async function addTodayGameCompletedColumn() {
  try {
    await sql`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS today_game_completed BOOLEAN DEFAULT FALSE
    `;
    console.log('✅ today_game_completed column added to database');
  } catch (error) {
    console.error('Error adding column:', error);
    throw error;
  }
}

// ...existing code...
export async function getUserByEmail(email) {
  const result = await sql`SELECT * FROM user_profiles WHERE email = ${email} LIMIT 1`;
  return result[0] || null;
}
// ...existing code...

// ...existing code...

// ✅ افزایش تعداد بازی‌ها وقتی خانه اول پر شد
export async function incrementGamesPlayed(userId) {
  try {
    const result = await sql`
      UPDATE user_profiles 
      SET crossword_games_played = COALESCE(crossword_games_played, 0) + 1
      WHERE id = ${userId}
      RETURNING crossword_games_played
    `;
    console.log('✅ Games played incremented to:', result[0].crossword_games_played);
    return result[0];
  } catch (error) {
    console.error('Error incrementing games played:', error);
    throw error;
  }
}

// ✅ افزایش بازی‌های کامل وقتی همه خانه‌ها درست شد
export async function incrementCompletedGames(userId) {
  try {
    const result = await sql`
      UPDATE user_profiles 
      SET completed_crossword_games = COALESCE(completed_crossword_games, 0) + 1
      WHERE id = ${userId}
      RETURNING completed_crossword_games
    `;
    console.log('✅ Completed games incremented to:', result[0].completed_crossword_games);
    return result[0];
  } catch (error) {
    console.error('Error incrementing completed games:', error);
    throw error;
  }
}

// ✅ افزایش بازی‌های ناتمام وقتی ساعت 8 شب بازی قفل شد
export async function incrementIncompleteGames(userId) {
  try {
    const result = await sql`
      UPDATE user_profiles 
      SET incomplete_crossword_games = COALESCE(incomplete_crossword_games, 0) + 1
      WHERE id = ${userId}
      RETURNING incomplete_crossword_games
    `;
    console.log('✅ Incomplete games incremented to:', result[0].incomplete_crossword_games);
    return result[0];
  } catch (error) {
    console.error('Error incrementing incomplete games:', error);
    throw error;
  }
}

// ✅ چک کن آیا بازی امروز شروع شده است
export async function hasUserStartedGameToday(userId) {
  try {
    const result = await sql`
      SELECT id FROM crossword_games
      WHERE user_id = ${userId}
      AND DATE(started_at) = CURRENT_DATE
      LIMIT 1
    `;
    return result.length > 0;
  } catch (error) {
    console.error('Error checking if game started:', error);
    return false;
  }
}

// ...existing code...

// ...existing code...


// جدید: علامت‌گذاری شروع بازی و افزایش شمارش فقط یک بار برای هر بازی
export async function markGameStarted(gameId, userId) {
  try {
    const rows = await sql`SELECT started_marked FROM crossword_games WHERE id = ${gameId} LIMIT 1`;
    if (!rows || rows.length === 0) return { ok: false, reason: 'game-not-found' };
    if (rows[0].started_marked) return { ok: false, reason: 'already-marked' };

    await sql`UPDATE crossword_games SET started_marked = TRUE WHERE id = ${gameId}`;

    const res = await sql`
      UPDATE user_profiles
      SET crossword_games_played = COALESCE(crossword_games_played,0) + 1
      WHERE id = ${userId}
      RETURNING crossword_games_played
    `;
    return { ok: true, newCount: res[0]?.crossword_games_played ?? null };
  } catch (error) {
    console.error('markGameStarted error:', error);
    throw error;
  }
}
// ...existing code...

// اضافه کردن ستون started_marked به جدول crossword_games
export async function addStartedMarkedColumn() {
  try {
    await sql`
      ALTER TABLE crossword_games 
      ADD COLUMN IF NOT EXISTS started_marked BOOLEAN DEFAULT FALSE
    `;
    console.log('✅ started_marked column added to crossword_games table');
  } catch (error) {
    console.error('Error adding started_marked column:', error);
    throw error;
  }
}