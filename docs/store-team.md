# Store signup and staff accounts

On `demo-version`, choose **Switch to store side** on the customer login page.

- **Login**: use an account assigned to the store. An ordinary customer account cannot log in on the store side until an owner adds it.
- **Sign Up**: enter the owner's name, store name, pickup point, email and password. Existing customers use their current email and password: the store is linked to the same account, preserving their profile, password and customer history. A new email creates a new owner account. The store starts with no menu items; add them from **Menu**. An incorrect existing-account password cannot create a store. Repeating the same store name for the same owner is rejected.
- **Team**: shows the owner and staff assigned to the active store. Only the owner can add staff. All assigned staff can manage that store's menu and orders through their own login sessions.

In **Team → Add staff**, enter an existing account's email to assign it to the store, or enter a name, email and password to create a new staff account. Existing account passwords are never changed by this form. Share a newly created account's password privately and use distinct accounts for each person.

An account can belong to several stores. Use the active café selector to switch between assigned stores. Assignments never grant access to other stores.

## API additions

| Method | Endpoint | Access / body |
| --- | --- | --- |
| POST | `/api/auth/store-register` | Public: `name`, `email`, `password`, `storeName`, `pickupPoint`; creates store + owner and sets session cookie |
| POST | `/api/auth/login` | `email`, `password`, optional `staff: true` to require a store assignment |
| GET | `/api/staff/cafes/:cafeId/team` | Assigned staff; returns `ownerUserId` and `items` with user ID, name and email |
| POST | `/api/staff/cafes/:cafeId/team` | Store owner only; existing email, or `name`, `email`, `password` for a new account |

MySQL uses the existing `cafe_staff` join table for multiple staff per store, and the additive `cafe_owners` table for one owner per store. New store/account/membership changes commit in one transaction. Existing demo stores designate their earliest assigned staff account as owner during migration; the original sample staff accounts therefore manage their original teams. Passwords remain salted hashes. Password hashes are never returned from the team API.

The launcher applies the additive schema on startup. Existing data is retained. JSON development mode also stores ownership and membership. Run `node --test backend/test/demo.test.js` to check owner permissions, duplicate staff assignments, store isolation and restart persistence in an isolated JSON test database.

For manual testing, create a test store, add a second staff account, then open a separate browser profile and sign in with that staff account. Both accounts should see the same store's menu and orders; the staff account should not see the Add staff form or be able to add staff through the API.
