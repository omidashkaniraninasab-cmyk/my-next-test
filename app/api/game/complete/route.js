export async function POST(request) {
  try {
    const { gameId, userId } = await request.json(); // finalScore رو حذف کن
    
    console.log('🎯 Marking game as completed for user:', userId);

    // فقط وضعیت بازی رو آپدیت کن
    await sql`
      UPDATE crossword_games 
      SET 
        completed = TRUE, 
        completed_at = CURRENT_TIMESTAMP, 
        finished_at = CURRENT_TIMESTAMP
      WHERE id = ${gameId}
    `;

    // فقط وضعیت کاربر رو آپدیت کن (امتیازها قبلاً اضافه شدن)
    await sql`
      UPDATE user_profiles 
      SET 
        today_game_completed = TRUE
      WHERE id = ${userId}
    `;

    console.log('✅ Game marked as completed');

    return Response.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error completing game:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}