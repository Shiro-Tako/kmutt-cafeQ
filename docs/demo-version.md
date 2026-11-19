# Demo version

Branch `demo-version` runs the complete customer and staff flow with Express and a local JSON data file. It uses the existing API contract. Run one backend process at a time against each demo data file.

For the laptop-hosted MySQL version and public HTTPS link, follow [the laptop server guide](laptop-server.md). The laptop launcher sets DATA_STORE=mysql and creates separate database credentials. The JSON instructions below apply when running the backend directly.

From the repository root, install dependencies with `npm.cmd --prefix backend ci` and `npm.cmd --prefix frontend ci`. Start these commands in two PowerShell windows:

```powershell
npm.cmd --prefix backend run dev
```

```powershell
npm.cmd --prefix frontend run dev
```

Open http://localhost:5173. In `backend/.env`, use `CATALOG_SOURCE=demo` if you already have a file with a different catalog source. The frontend on this branch always connects to the account APIs.

## Demo accounts

All three seeded accounts use password `CafeQ123!`.

| Email | Role |
| --- | --- |
| customer@example.test | Customer |
| staff-rung@example.test | Staff for Cafe Rung |
| staff-foodcourt@example.test | Staff for Food Court |

Customer registration creates a new customer account. Staff use the seeded accounts through **Switch to store side**. Staff assignments are stored in the demo data.

## Try the complete flow

1. Open a normal browser as the customer and an incognito window as Cafe Rung staff.
2. Add a Cafe Rung menu item to the basket, continue to checkout, then simulate payment.
3. The staff Orders page receives the new Waiting order within approximately five seconds.
4. Advance it through Preparing, Ready and Done. The customer's order history updates automatically.
5. Open staff Menu to add, edit or remove an item. The customer catalog refreshes within approximately five seconds.
6. Restart Express and sign in again to check that orders and menu changes are retained.

Data is saved to ignored `backend/data/demo.json`, including password hashes and session token hashes. An optional `DEMO_DATA_FILE` environment variable selects another file for tests. Keep test data separate from your demo data. Initial seed accounts are created when the file does not exist.

Payments are simulated and no money is collected. The demo uses one local server and JSON persistence. The team's MySQL implementation can be integrated later on its own branch.

Run the demo regression test from the root with `node --test backend/test/demo.test.js`. It uses its own temporary data file and tests store permissions, duplicate confirmation, price changes, order status transitions, logout and persistence after restarting Express.
