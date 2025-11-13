import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const sql = neon(process.env.DATABASE_URL);

// ایجاد جدول sessions اگر وجود نداره
async function ensureSessionsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id VARCHAR(100) PRIMARY KEY,
        user_id INTEGER REFERENCES user_profiles(id) ON DELETE CASCADE,
        session_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      )
    `;
  } catch (error) {
    console.error('Error creating sessions table:', error);
    throw error;
  }
}

// ایجاد session در دیتابیس (فقط فیلدهای غیرحساس کاربر ذخیره می‌شود)
export async function createSession(user, ttlDays = 7) {
  await ensureSessionsTable();

  const sessionId = crypto.randomUUID();
  const safeUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name
  };

  const sessionData = {
    user: safeUser,
    createdAt: new Date().toISOString()
  };

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);

  try {
    await sql`
      INSERT INTO user_sessions (session_id, user_id, session_data, expires_at)
      VALUES (
        ${sessionId},
        ${user.id},
        ${JSON.stringify(sessionData)}::jsonb,
        ${expiresAt}
      )
    `;
  } catch (error) {
    console.error('Error inserting session:', error);
    throw error;
  }

  // پاک‌سازی sessionهای منقضی شده (عدم اختلال در پاسخ اصلی)
  (async () => {
    try {
      await sql`DELETE FROM user_sessions WHERE expires_at < NOW()`;
    } catch (e) {
      console.error('Cleanup expired sessions failed:', e);
    }
  })();

  return sessionId;
}

// دریافت session (متادیتا و داده‌ها برگردانده می‌شود)
export async function getSession(sessionId) {
  try {
    if (!sessionId) return null;

    const rows = await sql`
      SELECT session_id, user_id, session_data, expires_at
      FROM user_sessions
      WHERE session_id = ${sessionId} AND expires_at > NOW()
      LIMIT 1
    `;

    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    return {
      sessionId: row.session_id,
      userId: row.user_id,
      expiresAt: row.expires_at,
      sessionData: typeof row.session_data === 'string' ? JSON.parse(row.session_data) : row.session_data
    };
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

// حذف session
export async function destroySession(sessionId) {
  try {
    if (!sessionId) return false;
    await ensureSessionsTable();
    await sql`DELETE FROM user_sessions WHERE session_id = ${sessionId}`;
    return true;
  } catch (error) {
    console.error('Destroy session error:', error);
    return false;
  }
}

// تابع دیباگ برای نمایش sessionها (برای توسعه)
export async function debugSessions(limit = 50) {
  try {
    await ensureSessionsTable();
    const rows = await sql`
      SELECT session_id, user_id, session_data, created_at, expires_at
      FROM user_sessions
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return rows;
  } catch (error) {
    console.error('Debug sessions error:', error);
    return [];
  }
}