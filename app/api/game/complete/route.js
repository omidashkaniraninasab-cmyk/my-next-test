export async function POST(request) {
  try {
    const { gameId, finalScore, userId } = await request.json();
    
    console.log('🎯 Completing game - ONLY updating status, not scores');

    // ۱. آپدیت وضعیت بازی
    await sql`
      UPDATE crossword_games 
      SET 
        completed = TRUE, 
        score = ${finalScore}, 
        completed_at = CURRENT_TIMESTAMP, 
        finished_at = CURRENT_TIMESTAMP
      WHERE id = ${gameId}
    `;

    // ۲. آپدیت وضعیت کاربر - فقط today_game_completed رو آپدیت کن
    await sql`
      UPDATE user_profiles 
      SET 
        today_game_completed = TRUE,  // فقط این رو آپدیت کن
        instant_crossword_score = 0   // امتیاز لحظه‌ای رو ریست کن
        // امتیازها رو آپدیت نکن - قبلاً اضافه شدن
      WHERE id = ${userId}
    `;

    // ۳. آپدیت رتبه همه کاربران
    await updateUserRanks();

    console.log('✅ Game status updated (scores already added)');

    return Response.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error completing game:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}