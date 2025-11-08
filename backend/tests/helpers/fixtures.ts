import bcrypt from 'bcrypt';

export const testUsers = {
  valid: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
  },
  admin: {
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
  },
  noName: {
    email: 'noname@example.com',
    password: 'password123',
  },
};

export async function createHashedPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export const testMessages = {
  simple: 'Hello, how are you?',
  long: 'A'.repeat(2000),
  empty: '',
  withEmojis: 'Hello 👋 How are you? 😊',
};