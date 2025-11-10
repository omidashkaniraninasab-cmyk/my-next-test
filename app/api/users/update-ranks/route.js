import { updateUserRanks } from '@/lib/db';

export async function POST(request) {
  try {
    console.log('🔄 Starting rank update...');
    
    const updatedCount = await updateUserRanks();
    
    console.log('✅ Ranks updated successfully');
    
    return Response.json({ 
      success: true,
      message: `رتبه‌های ${updatedCount} کاربر آپدیت شد`,
      updatedCount: updatedCount
    });
    
  } catch (error) {
    console.error('Update ranks error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}