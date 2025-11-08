import { getUsers, createUser } from '@/lib/db';

export async function GET() {
  try {
    const users = await getUsers();
    return Response.json(users);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, email } = await request.json();
    
    if (!name || !email) {
      return Response.json({ error: 'نام و ایمیل ضروری است' }, { status: 400 });
    }

    const newUser = await createUser(name, email);
    return Response.json(newUser, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}