// @ts-check
const { test, expect, DEMO_LOGIN } = require('./fixtures');

// If the health check fails, the API itself is down,
// so other failures in the same run are not real bugs.
test('health check: GET /ping answers 201', async ({ request }) => {
  const response = await request.get('/ping');

  // The Restful Booker docs say a healthy API answers 201 Created here.
  expect(response.status()).toBe(201);
});

test('login with the demo account returns a token', async ({ request }) => {
  const response = await request.post('/auth', { data: DEMO_LOGIN });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.token).toEqual(expect.any(String));
  expect(body.token.length).toBeGreaterThan(0);
});

test('login with a wrong password is refused', async ({ request }) => {
  const response = await request.post('/auth', {
    data: { ...DEMO_LOGIN, password: 'not-the-right-one' },
  });

  // This API answers 200 even when the login fails (401 is the usual code),
  // so the body is what proves it was refused: a reason and no token.
  expect(await response.json()).toEqual({ reason: 'Bad credentials' });
});
