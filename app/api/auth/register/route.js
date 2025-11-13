import { createUserProfile } from '@/lib/db';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { username, email, password, firstName, lastName, bankCardNumber } = await request.json();
    
    console.log('Register attempt:', { username, email, firstName, lastName });
    
    // ✅ بررسی فیلدهای ضروری
    if (!username || !email || !password || !firstName || !lastName) {
      return Response.json({ 
        error: 'همه فیلدهای ضروری را پر کنید' 
      }, { status: 400 });
    }

    // ✅ بررسی رمز عبور قوی
    if (password.length < 6) {
      return Response.json({ 
        error: 'رمز عبور باید حداقل 6 کاراکتر باشد' 
      }, { status: 400 });
    }

    // ✅ بررسی format ایمیل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ 
        error: 'ایمیل نامعتبر است' 
      }, { status: 400 });
    }

    // ✅ هش کردن رمز عبور
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ ایجاد کاربر جدید (DB باید duplicate چک کنه)
    let user;
    try {
      user = await createUserProfile({
        username, 
        email, 
        password: hashedPassword,  // ✅ هش شده
        firstName, 
        lastName, 
        bankCardNumber: bankCardNumber || null
      });
    } catch (dbError) {
      if (dbError.message.includes('duplicate') || dbError.code === '23505') {
        return Response.json({ 
          error: 'این ایمیل یا username قبلاً ثبت شده است' 
        }, { status: 409 });
      }
      throw dbError;
    }

    console.log('User created:', user.id);

    // ✅ ایجاد session
    const sessionId = await createSession(user);

    // ✅ برگرداندن response
    return new Response(JSON.stringify({ 
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        registration_date: user.registration_date,
        bank_card_number: user.bank_card_number
      },
      sessionId: sessionId
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=${7 * 24 * 60 * 60}`
      }
    });
    
  } catch (error) {
    console.error('Register error details:', error);
    return Response.json({ 
      success: false,
      error: 'خطا در ثبت نام',
      details: error.message
    }, { status: 500 });
  }
}