# Ready-for-pickup notifications

The customer app checks its authenticated `/api/orders` endpoint approximately every five seconds while open, and refreshes when the tab becomes visible or focused again. **Ready** and **Done** both produce notifications: Ready says the order can be picked up, while Done says the café marked it completed. An unread notification adds a red circle around the bell and a red count badge. Clicking a notification opens that order's expanded Details, including its pickup map.

Staff flow remains **Waiting → Preparing → Ready → Done**. Use **Mark Ready** when a drink can be collected. **Complete Order** moves it to Done after collection. Done has its own notification event, so the customer is still notified if Ready and Done both occur between two polls. The panel shows the latest Ready or Done status per order and keeps completed orders available.

Opening the bell marks the displayed notifications as read. The toast can also be dismissed without marking it read; the red circle and badge remain until the customer reads it. Each status event is announced once per order per browser, and its read state survives navigation and reloads. State is scoped by account ID and includes the order creation timestamp and status so reused demo order IDs do not accidentally inherit old read flags.

`frontend/src/hooks/useOrderNotifications.js` manages polling and browser-local read state. `CafeLayout.jsx` renders the bell/panel, and `App.jsx` keeps the toast mounted across customer pages. Staff routes do not poll customer notifications. The API already limits order history to the signed-in customer; notification data is never obtained from the staff queue.

This is an in-app notification, not operating-system push: closing the page or browser stops delivery. Mobile browsers can delay polling in the background. Read state is local to the browser and is not synced between devices. No notification permissions, email or paid service are required.

## Manual verification

1. Sign in as a customer and create an order through simulated payment.
2. In another browser profile, sign in as staff assigned to that store.
3. Move the order to Preparing: the customer should not receive a ready notification.
4. Choose Mark Ready: within approximately five seconds in the open customer page, expect one unread badge and a toast.
5. Click View pickup details: verify the correct order and map expand and the badge clears.
6. Reload and wait for another poll: the same toast should not repeat.
7. Another customer must not see the order or notification.
8. Choose Complete Order as staff: expect a new completion toast and unread red bell circle. The panel should show the completed status.
9. Create another test order and advance it through Ready to Done while the customer page is closed. Open it again: a completion notification must still appear even though this browser never observed Ready.

Run `node --test frontend/src/data/orderNotifications.test.js` and build with `npm.cmd --prefix frontend run build`. The implementation was also checked with separate staff/customer headless Chrome sessions on a temporary JSON database, including read persistence, account isolation, missed Ready transitions, the red bell circle, Details navigation, and mobile overflow; the production database was not changed by that test. The server serves entry HTML with `Cache-Control: no-store`; already-open old tabs still need a reload to run a new build.
