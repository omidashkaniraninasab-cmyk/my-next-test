import { NextResponse } from 'next/server';

// دیتابیس موقت
const dailyChallengeDB = {
  challengeUsers: new Map(),
  challengeScores: new Map()
};

export async function GET() {
  try {
    // ساخت رتبه‌بندی کاملاً مستقل برای چالش
    const usersArray = Array.from(dailyChallengeDB.challengeUsers.values());
    
    // مرتب‌سازی بر اساس امتیاز کل چالش
    const sortedUsers = usersArray.sort((a, b) => b.totalScore - a.totalScore);
    
    const leaderboard = sortedUsers.map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      totalScore: user.totalScore,
      gamesPlayed: user.gamesPlayed,
      todayScore: user.todayScore
    }));
    
    return NextResponse.json({
      success: true,
      leaderboard,
      gameType: 'daily-challenge',
      totalPlayers: sortedUsers.length,
      updatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 });
  }
}