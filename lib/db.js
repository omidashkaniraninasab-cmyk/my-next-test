import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function createUsersTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

export async function getUsers() {
  const users = await sql`SELECT * FROM users ORDER BY created_at DESC`;
  return users;
}

export async function createUser(name, email) {
  const result = await sql`
    INSERT INTO users (name, email) 
    VALUES (${name}, ${email})
    RETURNING *
  `;
  return result[0];
}