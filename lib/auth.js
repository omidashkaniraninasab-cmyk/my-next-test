// سیستم session ساده بدون استفاده از cookies() - سازگار با App Router
let sessionStore = new Map();

export async function createSession(user) {
  try {
    const sessionId = Math.random().toString(36).substring(2);
    const sessionData = {
      user: user,
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 روز
    };

    sessionStore.set(sessionId, sessionData);
    
    // برگرداندن sessionId که باید در response header ست شود
    return sessionId;
  } catch (error) {
    console.error('Create session error:', error);
    throw error;
  }
}

export async function getSession(sessionId) {
  try {
    if (!sessionId) return null;

    const sessionData = sessionStore.get(sessionId);
    
    if (!sessionData) return null;

    // بررسی انقضا
    if (Date.now() > sessionData.expiresAt) {
      sessionStore.delete(sessionId);
      return null;
    }
    
    return sessionData;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

export async function destroySession(sessionId) {
  try {
    if (sessionId) {
      sessionStore.delete(sessionId);
    }
  } catch (error) {
    console.error('Destroy session error:', error);
  }
}

// پاک کردن sessionهای منقضی شده هر ساعت
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, sessionData] of sessionStore.entries()) {
    if (now > sessionData.expiresAt) {
      sessionStore.delete(sessionId);
    }
  }
}, 60 * 60 * 1000);