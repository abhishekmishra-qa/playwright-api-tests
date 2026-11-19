// @ts-check
const { test, expect, fakeBooking, authHeader } = require('./fixtures');

// Things the API must refuse: changes without a valid login, ids that do not exist and bad input.
// These matter as much as the happy path.

test('update without a token is refused (403) and nothing changes', async ({ request, booking }) => {
  const response = await request.put(`/booking/${booking.id}`, {
    data: fakeBooking({ firstname: 'Changed' }),
  });

  expect(response.status()).toBe(403);

  // A 403 alone is not enough: make sure the booking really stayed the same.
  const saved = await request.get(`/booking/${booking.id}`);
  expect(await saved.json()).toEqual(booking.data);
});

test('partial update with a fake token is refused (403)', async ({ request, booking }) => {
  // Checks that the API validates the token, not just that one is there.
  const response = await request.patch(`/booking/${booking.id}`, {
    data: { firstname: 'Changed' },
    headers: authHeader('not-a-real-token'),
  });

  expect(response.status()).toBe(403);
});

test('delete without a token is refused (403) and the booking stays', async ({ request, booking }) => {
  const response = await request.delete(`/booking/${booking.id}`);

  expect(response.status()).toBe(403);

  const stillThere = await request.get(`/booking/${booking.id}`);
  expect(stillThere.status()).toBe(200);
});

test('get a booking that does not exist returns 404', async ({ request }) => {
  // Ids start at 1, count up and are reset often, so this one is never used.
  const response = await request.get('/booking/999999999');

  expect(response.status()).toBe(404);
});

test('create a booking with missing fields is refused', async ({ request }) => {
  const response = await request.post('/booking', { data: { firstname: 'Only a first name' } });

  // This API answers 500. A 400 with a clear message would be better,
  // but the key point is that the booking is refused.
  expect(response.status()).toBeGreaterThanOrEqual(400);
});

test('known bug: a price sent as text is accepted and saved as null', async ({ request, cleanup }) => {
  // Marked as expected to fail. The run stays green while the bug is open,
  // and this test turns red once the API is fixed, so we know to re-check it.
  test.fail();

  const response = await request.post('/booking', {
    data: fakeBooking({ totalprice: 'two hundred' }),
  });
  const body = await response.json().catch(() => ({}));
  // The bug creates a booking, so delete it after the test.
  if (body.bookingid) cleanup.push(body.bookingid);

  // What should happen: a price that is not a number is refused.
  expect(response.status()).toBe(400);
});
