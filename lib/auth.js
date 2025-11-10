import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// ایجاد جدول sessions اگر وجود نداره
async function ensureSessionsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id VARCHAR(100) PRIMARY KEY,
        user_id INTEGER REFERENCES user_profiles(id),
        session_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      )
    `;
  } catch (error) {
    console.error('Error creating sessions table:', error);
  }
}

// ایجاد session در دیتابیس
export async function createSession(user) {
  await ensureSessionsTable();
  
  const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const sessionData = {
    user: user,
    createdAt: new Date().toISOString()
  };
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 روز
  
  await sql`
    INSERT INTO user_sessions (session_id, user_id, session_data, expires_at)
    VALUES (${sessionId}, ${user.id}, ${JSON.stringify(sessionData)}, ${expiresAt.toISOString()})
  `;

  // پاک کردن sessionهای منقضی شده
  await sql`DELETE FROM user_sessions WHERE expires_at < NOW()`;

  return sessionId;
}

// گرفتن session از دیتابیس - تصحیح شده
export async function getSession(sessionId) {
  try {
    if (!sessionId) return null;

    console.log('🔍 Searching for session:', sessionId);

    const sessions = await sql`
      SELECT * FROM user_sessions 
      WHERE session_id = ${sessionId} AND expires_at > NOW()
    `;

    console.log('📊 Sessions found:', sessions.length);
    
    if (sessions.length === 0) {
      console.log('❌ No active session found for:', sessionId);
      return null;
    }

    const session = sessions[0];
    console.log('✅ Session found:', {
      session_id: session.session_id,
      user_id: session.user_id,
      expires_at: session.expires_at
    });

    // برگرداندن session_data به صورت object
    return typeof session.session_data === 'string' 
      ? JSON.parse(session.session_data)
      : session.session_data;

  } catch (error) {
    console.error('💥 Get session error:', error);
    return null;
  }
}

// حذف session
export async function destroySession(sessionId) {
  try {
    if (sessionId) {
      await sql`DELETE FROM user_sessions WHERE session_id = ${sessionId}`;
    }
  } catch (error) {
    console.error('Destroy session error:', error);
  }
}

// تابع جدید برای دیباگ sessionها
export async function debugSessions() {
  try {
    console.log('🔍 Debugging sessions table...');
    
    const sessions = await sql`
      SELECT * FROM user_sessions 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    
    console.log('📊 Recent sessions:', sessions);
    return sessions;
  } catch (error) {
    console.error('Debug sessions error:', error);
    return [];
  }
}