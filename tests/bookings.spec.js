// @ts-check
const { test, expect, fakeBooking, authHeader } = require('./fixtures');

// The main path of a hotel booking: create, read, change and delete.
// Every test gets its own booking, so they can run in any order.

const DATE = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

test('create a booking: returns an id and saves exactly what we sent', async ({ request, cleanup }) => {
  const data = fakeBooking();

  const response = await request.post('/booking', { data });

  expect(response.status()).toBe(200);
  const body = await response.json();
  // Register it for clean-up first, so it is deleted even if a check below fails.
  cleanup.push(body.bookingid);
  expect(body.bookingid).toEqual(expect.any(Number));
  expect(body.booking).toEqual(data);
});

test('get a booking by id: right data and right field types', async ({ request, booking }) => {
  const response = await request.get(`/booking/${booking.id}`);

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toEqual(booking.data);

  // Shape check: apps that use this API rely on these fields and types.
  // A missing field, an extra field, a price as text or a date in another format would break them.
  expect(body).toEqual({
    firstname: expect.any(String),
    lastname: expect.any(String),
    totalprice: expect.any(Number),
    depositpaid: expect.any(Boolean),
    bookingdates: {
      checkin: expect.stringMatching(DATE),
      checkout: expect.stringMatching(DATE),
    },
    additionalneeds: expect.any(String),
  });
});

test('update a booking (PUT): every field is replaced', async ({ request, booking, token }) => {
  const updated = fakeBooking({
    firstname: 'Updated',
    totalprice: 510,
    depositpaid: false,
    bookingdates: { checkin: '2031-04-01', checkout: '2031-04-03' },
    additionalneeds: 'Late checkout',
  });

  const response = await request.put(`/booking/${booking.id}`, {
    data: updated,
    headers: authHeader(token),
  });

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual(updated);

  // The answer could just echo our request, so read the booking again to prove it was saved.
  const saved = await request.get(`/booking/${booking.id}`);
  expect(await saved.json()).toEqual(updated);
});

test('partial update (PATCH): only the sent fields change', async ({ request, booking, token }) => {
  const changes = { firstname: 'Patched', additionalneeds: 'Extra pillow' };

  const response = await request.patch(`/booking/${booking.id}`, {
    data: changes,
    headers: authHeader(token),
  });

  // Everything we did not send must stay as it was.
  const expected = { ...booking.data, ...changes };
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual(expected);

  const saved = await request.get(`/booking/${booking.id}`);
  expect(await saved.json()).toEqual(expected);
});

test('delete a booking: it is gone afterwards', async ({ request, booking, token }) => {
  const response = await request.delete(`/booking/${booking.id}`, { headers: authHeader(token) });

  // This API answers 201 for a delete (most APIs use 200 or 204). The docs say 201, so we check for it.
  expect(response.status()).toBe(201);

  const after = await request.get(`/booking/${booking.id}`);
  expect(after.status()).toBe(404);
});
