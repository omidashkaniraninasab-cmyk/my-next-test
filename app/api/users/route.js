import { createUserProfile, getUserProfiles } from '@/lib/db';

export async function GET() {
  try {
    const users = await getUserProfiles();
    return Response.json(users);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userData = await request.json();
    
    const requiredFields = ['username', 'email', 'password', 'firstName', 'lastName'];
    for (const field of requiredFields) {
      if (!userData[field]) {
        return Response.json({ error: `فیلد ${field} ضروری است` }, { status: 400 });
      }
    }

    const newUser = await createUserProfile(userData);
    return Response.json(newUser, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}