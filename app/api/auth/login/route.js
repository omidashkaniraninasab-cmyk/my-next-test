import { getUserByEmail } from '@/lib/db';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return Response.json({ error: 'ایمیل و رمز عبور لازم است' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return Response.json({ error: 'ایمیل یا رمز عبور اشتباه است' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return Response.json({ error: 'ایمیل یا رمز عبور اشتباه است' }, { status: 401 });
    }

    const sessionId = await createSession(user);

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=${7 * 24 * 60 * 60}`
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return Response.json({ success: false, error: 'خطا در ورود' }, { status: 500 });
  }
}