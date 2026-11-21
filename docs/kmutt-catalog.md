# KMUTT Bangmod demo catalog

Store names and campus locations reference the [KMUTT property management coffee-shop directory](https://bpuu.kmutt.ac.th/coffee-shop/), checked on 20 November 2026. This directory is the source for the locations; current opening hours or operation were not independently confirmed.

| Store | Pickup location | Menu items | Demo staff email |
| --- | --- | --- | --- |
| Café Amazon | Library building N10 | 10 | amazon-library@example.test |
| Inthanin | Car parking building S2 | 10 | inthanin-s2@example.test |
| KAMU KAMU | Car parking building S2 | 10 | kamu-s2@example.test |
| Fresh Me | Library building N10, floor 1 | 10 | freshme-library@example.test |
| Starbucks | Car parking building S2 | 10 | starbucks-s2@example.test |

The 50 items, descriptions, prices, availability and existing illustrative photographs are a **demo dataset**, not verified offerings or prices of the KMUTT branches. No vendor endorsement or real ordering integration is implied. Every menu description and the customer catalog identify the data as illustrative. Prices in the JSON and database are integer satang; the frontend displays baht.

The source dataset is `database/kmutt-catalog.json`. Fresh laptop databases use it through `DEMO_CATALOG=kmutt` in the launcher. Restarting an initialized database does not reseed or erase changes. JSON development and regression fixtures retain their original catalog unless this environment variable is explicitly set.

## Explicit maintenance reset

The following command was used for the requested cleanup. Do not run it during ordinary startup: it replaces the catalog and removes orders, payments, queue rows, favorites, sessions and test accounts.

```powershell
node scripts/reset-campus-data.mjs --keep-real-accounts --confirm-reset
```

Run from the repository root while the laptop MySQL instance is running. It targets only `kmutt_cafeq` using the ignored `.local/server.json` connection details. It takes the demo transaction lock, writes a full JSON table backup under `.local/backups/`, then deletes and inserts rows in one transaction with foreign keys enabled. Failure rolls back the database transaction. Backups contain private account/session data and must remain local.

Real accounts (emails outside the reserved `@example.test` test domain) retain their user IDs, names, email addresses, password hashes and phone numbers. Old store assignments are removed with the old stores. If a retained account owned an old store, the earliest such owner manages all five replacement demo stores. Otherwise each store's generated demo staff account owns its store. Other retained accounts remain customers and can be assigned through Team.

The reset creates a fresh demo customer plus the five staff accounts above. Their password comes from `accountPassword` in `.local/server.json`; real account passwords are unchanged. Everyone must log in again because old sessions are cleared. Old unavailable basket entries are removed after the catalog reloads.

## Verify

```sql
USE kmutt_cafeq;
SELECT c.id, c.name, COUNT(m.id) AS menu_count
FROM cafes c
LEFT JOIN menu_items m ON m.cafe_id = c.id
GROUP BY c.id, c.name;
```

Expect five stores with ten items each immediately after the reset. `orders`, `payments`, `Order`, `OrderDetail` and `Queue` should be empty until new orders are placed. Check the café filter and all menu categories in the browser; tea shops have their items under Tea & More. Existing real owners can switch active café on the staff side.

Run `node --test backend/test/campusSeed.test.js backend/test/demo.test.js` and `npm.cmd --prefix frontend run build` to check catalog generation, account preservation and the ordering/team regressions.
