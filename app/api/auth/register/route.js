import { createUserProfile } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, email, password, firstName, lastName, bankCardNumber } = await request.json();
    
    // بررسی فیلدهای ضروری
    if (!username || !email || !password || !firstName || !lastName) {
      return Response.json({ 
        error: 'همه فیلدهای ضروری را پر کنید' 
      }, { status: 400 });
    }

    // ایجاد کاربر جدید
    const user = await createUserProfile({
      username, email, password, firstName, lastName, bankCardNumber
    });

    // ایجاد session برای کاربر
    await createSession(user);

    return Response.json({ 
      success: true,
      user: user
    }, { status: 201 });
    
  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}