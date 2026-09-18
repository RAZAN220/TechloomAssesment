/**
 * Authentication tests — registration, login, session and security basics.
 */
const { api, registerUser, uniqueEmail } = require('./helpers');

describe('Authentication', () => {
  test('registers a user, hashes the password and returns a token', async () => {
    const email = uniqueEmail('auth');
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Ada Lovelace', email, password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user.password).toBeUndefined();

    const User = require('../src/models/User');
    const stored = await User.findOne({ email }).select('+password');
    expect(stored.password).not.toBe('secret123'); // bcrypt hashed
    expect(stored.password.startsWith('$2')).toBe(true);
  });

  test('rejects duplicate email registration with 409', async () => {
    const { email } = await registerUser();
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Duplicate', email, password: 'secret123' });
    expect(res.status).toBe(409);
  });

  test('rejects an invalid registration payload with field errors', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'X', email: 'not-an-email', password: '123' });
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('logs in with valid credentials and rejects a wrong password', async () => {
    const { email } = await registerUser();
    const ok = await api().post('/api/auth/login').send({ email, password: 'secret123' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.token).toEqual(expect.any(String));

    const bad = await api().post('/api/auth/login').send({ email, password: 'nope' });
    expect(bad.status).toBe(401);
    expect(bad.body.message).toMatch(/invalid email or password/i);
  });

  test('GET /api/auth/me requires a valid token', async () => {
    const { token } = await registerUser();
    const ok = await api().get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.user.password).toBeUndefined();

    const anon = await api().get('/api/auth/me');
    expect(anon.status).toBe(401);

    const bad = await api().get('/api/auth/me').set('Authorization', 'Bearer garbage.token');
    expect(bad.status).toBe(401);
  });
});
