export async function POST(request) {
  try {
    const { gameId, finalScore, userId, bonusScore } = await request.json();
    
    console.log('🎯 Completing game with bonus:', bonusScore);

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

    // ۲. آپدیت وضعیت کاربر - پاداش رو اضافه کن و instant رو صفر کن
    await sql`
      UPDATE user_profiles 
      SET 
        today_crossword_score = today_crossword_score + ${bonusScore},
        total_crossword_score = total_crossword_score + ${bonusScore},
        today_game_completed = TRUE,
        instant_crossword_score = 0  -- حتماً صفر کن
      WHERE id = ${userId}
    `;

    // ۳. آپدیت رتبه همه کاربران
    await updateUserRanks();

    console.log('✅ Game completed with bonus and instant score reset');

    return Response.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error completing game:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}