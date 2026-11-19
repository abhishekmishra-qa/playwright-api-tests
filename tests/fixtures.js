// @ts-check
// Shared test data and fixtures.
// Each test gets fresh data and everything it creates is deleted afterwards,
// so tests never depend on each other or on what other people put in this public API.
const base = require('@playwright/test');

const { expect } = base;

// Public demo login from the Restful Booker docs, not a real account.
const DEMO_LOGIN = { username: 'admin', password: 'password123' };

// Fake booking data. The unique last name makes our bookings easy to spot
// among everyone else's on this shared practice API.
function fakeBooking(overrides = {}) {
  const runId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return {
    firstname: 'Testy',
    lastname: `McTest-${runId}`,
    totalprice: 245,
    depositpaid: true,
    bookingdates: { checkin: '2031-03-10', checkout: '2031-03-14' },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}

// Update and delete calls need the token as a cookie.
function authHeader(token) {
  return { Cookie: `token=${token}` };
}

const test = base.test.extend({
  // Logs in with the demo account and hands the token to the test.
  token: async ({ request }, use) => {
    const response = await request.post('/auth', { data: DEMO_LOGIN });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    await use(body.token);
  },

  // A list of booking ids that are deleted after the test.
  // A delete answers 405 if the test already removed the booking, which is fine here.
  cleanup: async ({ request, token }, use) => {
    const ids = [];
    await use(ids);
    for (const id of ids) {
      await request.delete(`/booking/${id}`, { headers: authHeader(token) });
    }
  },

  // A fresh booking for tests that need one to read, change or delete.
  booking: async ({ request, cleanup }, use) => {
    const data = fakeBooking();
    const response = await request.post('/booking', { data });
    expect(response.ok()).toBeTruthy();
    const { bookingid } = await response.json();
    cleanup.push(bookingid);
    await use({ id: bookingid, data });
  },
});

module.exports = { test, expect, DEMO_LOGIN, fakeBooking, authHeader };
