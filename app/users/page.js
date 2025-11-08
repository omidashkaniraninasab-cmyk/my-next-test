import { getUserProfiles } from '@/lib/db';

export default async function UsersPage() {
  const users = await getUserProfiles();

  return (
    <div style={{ padding: '20px' }}>
      <h1>لیست کاربران</h1>
      {users.length === 0 ? (
        <p>هنوز کاربری وجود ندارد</p>
      ) : (
        <ul>
          {users.map(user => (
            <li key={user.id} style={{ marginBottom: '10px' }}>
              <strong>{user.username}</strong> - {user.first_name} {user.last_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}