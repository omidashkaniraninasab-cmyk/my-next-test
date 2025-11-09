import { createUserProfile } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, email, password, firstName, lastName, bankCardNumber } = await request.json();
    
    console.log('Register attempt:', { username, email, firstName, lastName });
    
    // بررسی فیلدهای ضروری
    if (!username || !email || !password || !firstName || !lastName) {
      return Response.json({ 
        error: 'همه فیلدهای ضروری را پر کنید' 
      }, { status: 400 });
    }

    // ایجاد کاربر جدید
    const user = await createUserProfile({
      username, 
      email, 
      password, 
      firstName, 
      lastName, 
      bankCardNumber: bankCardNumber || null
    });

    console.log('User created:', user.id);

    // ایجاد session برای کاربر
    await createSession(user);

    return Response.json({ 
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        registration_date: user.registration_date,
        bank_card_number: user.bank_card_number
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Register error details:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      details: 'خطا در ایجاد کاربر'
    }, { status: 500 });
  }
}