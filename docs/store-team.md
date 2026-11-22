# Store login and staff accounts

On `demo-version`, choose **Switch to store side** on the customer login page.

- **Login**: use an account assigned to the store. An ordinary customer account cannot log in on the store side until an owner adds it.
- **Owner accounts**: the CafeQ administrator assigns these and shares the login details privately. Customer sign-up creates a customer account.
- **Team**: shows the owner and staff assigned to the active store. Only the owner can add staff. All assigned staff can manage that store's menu and orders through their own login sessions.

In **Team → Add staff**, enter an existing account's email to assign it to the store, or enter a name, email and password to create a new staff account. Existing account passwords are never changed by this form. Share a newly created account's password privately and use distinct accounts for each person.

An account can manage one store. Each store can have several staff members.

## API additions

| Method | Endpoint | Access / body |
| --- | --- | --- |
| POST | `/api/auth/login` | `email`, `password`, optional `staff: true` to require a store assignment |
| GET | `/api/staff/cafes/:cafeId/team` | Assigned staff; returns `ownerUserId` and `items` with user ID, name and email |
| POST | `/api/staff/cafes/:cafeId/team` | Store owner only; existing email, or `name`, `email`, `password` for a new account |

MySQL uses `cafe_staff` for staff assignments and `cafe_owners` for one owner per store. The five campus stores use the dedicated owner accounts listed in [the campus catalog](kmutt-catalog.md). Team membership changes commit in one transaction. Passwords are stored as salted hashes.

The launcher applies the additive schema on startup. Existing data is retained. JSON development mode also stores ownership and membership. Run `node --test backend/test/demo.test.js` to check owner permissions, duplicate staff assignments, store isolation and restart persistence in an isolated JSON test database.

For manual testing, log in with a demo owner, add a second staff account, then sign in with that staff account in a separate browser profile. Both accounts should see the same store's menu and orders. The Add staff form is available to the owner.
