// محاسبه و آپدیت رتبه همه کاربران
export async function updateUserRanks() {
  try {
    console.log('🔢 Calculating user ranks...');
    
    // گرفتن همه کاربران مرتب شده بر اساس امتیاز
    const users = await sql`
      SELECT id, total_crossword_score 
      FROM user_profiles 
      ORDER BY total_crossword_score DESC NULLS LAST
    `;

    console.log(`📊 Found ${users.length} users`);

    // آپدیت رتبه هر کاربر
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