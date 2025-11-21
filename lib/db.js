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
    await createUserLevelProfile(result[0].id);
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
  await addStartedMarkedColumn();
  
  try {
    // گرفتن user_code و display_name کاربر
    const user = await sql`
      SELECT user_code, display_name FROM user_profiles WHERE id = ${userId}
    `;
    
    const userCode = user[0]?.user_code;
    const displayName = user[0]?.display_name;

    console.log('🎯 Creating new game with user details:', { userId, userCode, displayName });

    const result = await sql`
      INSERT INTO crossword_games (
        user_id, puzzle_data, user_progress, started_at,
        user_code, display_name  // 🆕 اضافه شدن فیلدهای جدید
      )
      VALUES (
        ${userId},
        ${JSON.stringify(puzzleData)}::jsonb,
        ${JSON.stringify({})}::jsonb,
        CURRENT_TIMESTAMP,
        ${userCode},  // 🆕
        ${displayName}  // 🆕
      )
      RETURNING *
    `;
    
    console.log('✅ New game created with user details');
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
// در lib/db.js - تابع saveGameToHistory
// در lib/db.js - تابع saveGameToHistory رو اینطور اصلاح کن
export async function saveGameToHistory(userId, gameId, puzzleData, score, mistakes, completionTime = null) {
  try {
    // گرفتن user_code و display_name کاربر
    const user = await sql`
      SELECT user_code, display_name FROM user_profiles WHERE id = ${userId}
    `;
    
    const userCode = user[0]?.user_code;
    const displayName = user[0]?.display_name;

    console.log('🎯 Saving game history with user details:', { userId, userCode, displayName });

    const result = await sql`
      INSERT INTO game_history (
        user_id, game_id, puzzle_title, puzzle_size, score, mistakes, 
        completion_time, created_at, user_code, display_name  // 🆕 اضافه شدن فیلدهای جدید
      ) 
      VALUES (
        ${userId}, 
        ${gameId}, 
        ${puzzleData?.title || 'جدول روزانه'}, 
        ${puzzleData?.size || 6}, 
        ${score}, 
        ${mistakes}, 
        ${completionTime},
        CURRENT_TIMESTAMP,
        ${userCode},  // 🆕
        ${displayName}  // 🆕
      )
      RETURNING id, score, created_at
    `;

    console.log('✅ Game history saved with user details');
    return result[0];
  } catch (error) {
    console.error('Error saving game history:', error);
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
// در lib/db.js - مطمئن شوید این تابع دقیقاً اینگونه است
// در lib/db.js - تابع resetDailyScores را اینگونه اصلاح کنید
export async function resetDailyScores() {
  try {
    const result = await sql`
      UPDATE user_profiles 
      SET 
        today_crossword_score = 0,
        today_game_completed = FALSE,  -- 🆕 این خط حیاتی است
        instant_crossword_score = 0,   -- 🆕 این هم اضافه شود
        last_score_reset_date = CURRENT_DATE
      WHERE last_score_reset_date IS NULL OR last_score_reset_date < CURRENT_DATE
      RETURNING id
    `;
    
    const count = Array.isArray(result) ? result.length : 0;
    console.log(`✅ Daily scores AND game status reset for ${count} users`);
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


// ایجاد جدول سطوح کاربران
export async function createUserLevelsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS user_levels (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE REFERENCES user_profiles(id),
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      title VARCHAR(50) DEFAULT 'تازه‌کار',
      achievements JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log('✅ user_levels table created or already exists');
}

// ایجاد پروفایل سطح برای کاربر جدید
export async function createUserLevelProfile(userId) {
  await createUserLevelsTable();
  try {
    const result = await sql`
      INSERT INTO user_levels (user_id, level, xp, title)
      VALUES (${userId}, 1, 0, 'تازه‌کار')
      ON CONFLICT (user_id) DO NOTHING
      RETURNING *
    `;
    return result[0] || null;
  } catch (error) {
    console.error('Error creating user level profile:', error);
    throw error;
  }
}

// گرفتن اطلاعات سطح کاربر
export async function getUserLevel(userId) {
  try {
    const result = await sql`
      SELECT * FROM user_levels WHERE user_id = ${userId}
    `;
    return result[0] || { level: 1, xp: 0, title: 'تازه‌کار', achievements: [] };
  } catch (error) {
    console.error('Error getting user level:', error);
    return { level: 1, xp: 0, title: 'تازه‌کار', achievements: [] };
  }
}




// اضافه کردن XP به کاربر
export async function addUserXP(userId, xpToAdd, reason) {
  try {
    await createUserLevelsTable();
    
    // گرفتن وضعیت فعلی کاربر
    const currentLevel = await getUserLevel(userId);
    const newXP = currentLevel.xp + xpToAdd;
    
    // ❌ این بخش رو موقتاً غیرفعال کن
    // let newLevel = currentLevel.level;
    // let newTitle = currentLevel.title;
    // let leveledUp = false;
    
    // برای تست، سطح رو ثابت نگه می‌داریم
    let newLevel = currentLevel.level;
    let newTitle = currentLevel.title;
    let leveledUp = false;
    
    // آپدیت اطلاعات کاربر
    const result = await sql`
      INSERT INTO user_levels (user_id, level, xp, title)
      VALUES (${userId}, ${newLevel}, ${newXP}, ${newTitle})
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        xp = EXCLUDED.xp,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    console.log(`✅ XP added: ${xpToAdd} for ${reason}`, {
      userId,
      oldLevel: currentLevel.level,
      newLevel,
      oldXP: currentLevel.xp,
      newXP,
      leveledUp
    });
    
    return {
      leveledUp,
      oldLevel: currentLevel.level,
      newLevel,
      oldXP: currentLevel.xp,
      newXP,
      title: newTitle,
      userLevel: result[0]
    };
    
  } catch (error) {
    console.error('Error adding user XP:', error);
    throw error;
  }
}

// محاسبه XP بعد از هر بازی
export async function calculateGameXP(userId, gameData) {
  let xpToAdd = 0;
  
  // XP پایه برای هر بازی
  xpToAdd += 10;
  
  // XP برای بازی کامل
  if (gameData.completed) {
    xpToAdd += 50;
  }
  
  // XP برای امتیاز بالا
  if (gameData.score >= 50) {
    xpToAdd += 20;
  }
  
  // XP برای خطای کم
  if (gameData.mistakes <= 3) {
    xpToAdd += 15;
  }
  
  // XP برای بازی سریع (کمتر از ۱۰ دقیقه)
  if (gameData.completionTime && gameData.completionTime < 600) {
    xpToAdd += 25;
  }
  
  return await addUserXP(userId, xpToAdd, 'بازی کراسورد');
}


// ایجاد جدول پازل‌های ماهانه
export async function createMonthlyPuzzlesTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS monthly_puzzles (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        puzzle_data JSONB NOT NULL,
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Monthly puzzles table created or already exists');
  } catch (error) {
    console.error('❌ Error creating monthly puzzles table:', error);
    throw error;
  }
}

// بررسی وجود DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL تعریف نشده است!');
}



console.log('✅ اتصال به دیتابیس ایجاد شد');

export { sql };