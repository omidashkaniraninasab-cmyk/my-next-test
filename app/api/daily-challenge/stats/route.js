import { NextResponse } from 'next/server';

const dailyChallengeDB = {
  challengeUsers: new Map(),
  challengeAnswers: new Map()
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });
    }
    
    // گرفتن آمار کاملاً مستقل کاربر از چالش
    const userData = dailyChallengeDB.challengeUsers.get(userId);
    
    if (!userData) {
      return NextResponse.json({ 
        success: true, 
        stats: {
          totalScore: 0,
          todayScore: 0,
          gamesPlayed: 0,
          averageScore: 0,
          rank: 0,
          totalPlayers: 0
        }
      });
    }
    
    // محاسبه رتبه کاربر در چالش
    const allUsers = Array.from(dailyChallengeDB.challengeUsers.values());
    const sortedUsers = allUsers.sort((a, b) => b.totalScore - a.totalScore);
    const userRank = sortedUsers.findIndex(user => user.userId === userId) + 1;
    
    const stats = {
      totalScore: userData.totalScore,
      todayScore: userData.todayScore,
      gamesPlayed: userData.gamesPlayed,
      averageScore: userData.gamesPlayed > 0 ? Math.round(userData.totalScore / userData.gamesPlayed) : 0,
      rank: userRank,
      totalPlayers: sortedUsers.length,
      gameType: 'daily-challenge'
    };
    
    return NextResponse.json({
      success: true,
      stats
    });
    
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 });
  }
}