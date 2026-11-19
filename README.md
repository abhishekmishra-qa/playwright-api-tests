# playwright-api-tests

[![API tests](https://github.com/abhishekmishra-qa/playwright-api-tests/actions/workflows/api-tests.yml/badge.svg)](https://github.com/abhishekmishra-qa/playwright-api-tests/actions/workflows/api-tests.yml)

API tests for [Restful Booker](https://restful-booker.herokuapp.com/apidoc/index.html), a public practice API for hotel bookings. Written with Playwright Test in JavaScript. GitHub Actions runs them on every push, on every pull request and once a day.

## What it covers

- Health check and login, with good and bad credentials
- The full life of a booking: create, read, update (PUT), partial update (PATCH) and delete
- Negative cases: no token, fake token, an id that does not exist, missing fields
- Response shape: field names and types, not only status codes
- One known bug in the API, kept as an expected failure

## How to run

You need Node.js 20 or newer. No browser download is needed, these tests only call the API.

```bash
git clone https://github.com/abhishekmishra-qa/playwright-api-tests.git
cd playwright-api-tests
npm ci
npx playwright test
npx playwright show-report
```

## Test cases

| # | File | Test case | Expected result |
|---|------|-----------|-----------------|
| 1 | health-auth | Health check | `GET /ping` answers 201 |
| 2 | health-auth | Log in with the demo account | 200 and a token |
| 3 | health-auth | Log in with a wrong password | "Bad credentials" and no token |
| 4 | bookings | Create a booking | 200, a booking id, data saved exactly as sent |
| 5 | bookings | Get a booking by id | Same data, right field types and date format |
| 6 | bookings | Update a booking (PUT) | All fields replaced, also on a fresh read |
| 7 | bookings | Partial update (PATCH) | Only the sent fields change |
| 8 | bookings | Delete a booking | 201, then the booking answers 404 |
| 9 | negative | Update without a token | 403 and the booking is unchanged |
| 10 | negative | Partial update with a fake token | 403 |
| 11 | negative | Delete without a token | 403 and the booking is still there |
| 12 | negative | Get a booking that does not exist | 404 |
| 13 | negative | Create a booking with missing fields | Refused (4xx or 5xx) |
| 14 | negative | Known bug: price sent as text | Should be refused, but the API saves it as null. Marked as an expected failure |

## How it is built

- Each test gets its own booking from a fixture (`tests/fixtures.js`) and everything it creates is deleted afterwards. Tests do not depend on each other or on shared data, so they run in parallel.
- Test data is fake, with a unique last name per booking.
- The login is the public demo login from the Restful Booker docs.
- On CI a failed test is retried once, because the practice API is shared and sometimes slow. The HTML report is uploaded as an artifact on every run.

## What I noticed about this API

- A failed login answers 200 instead of 401.
- A delete answers 201 instead of 200 or 204.
- A booking with missing fields gives a 500 instead of a 400.
- A price sent as text is accepted and saved as null (test 14).

Built with Claude Code as a pair: I designed the test cases and reviewed every test.
