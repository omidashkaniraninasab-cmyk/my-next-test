import { updateUserRanks } from '@/lib/db';

export async function POST(request) {
  try {
    const updatedCount = await updateUserRanks();
    
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