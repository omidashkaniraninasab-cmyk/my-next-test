import { DailyPuzzle } from '@/lib/dailyPuzzle';

export async function POST(request) {
  try {
    const { action } = await request.json();
    
    if (action === 'generate') {
      const newPuzzle = DailyPuzzle.getDailyPuzzle();
      
      // ذخیره در localStorage مرورگر مدیر
      return Response.json({ 
        success: true, 
        puzzle: newPuzzle,
        message: 'جدول روزانه جدید ایجاد شد'
      });
    }
    
    return Response.json({ error: 'Action not found' }, { status: 400 });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}