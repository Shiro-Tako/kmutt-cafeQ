# KMUTT Bangmod demo catalog

Store names and campus locations reference the [KMUTT property management coffee-shop directory](https://bpuu.kmutt.ac.th/coffee-shop/), checked on 20 November 2026. This directory is the source for the locations; current opening hours or operation were not independently confirmed.

| Store | Pickup location | Menu items | Demo owner email |
| --- | --- | --- | --- |
| Café Amazon | Library building N10 | 12 | amazon-library@example.test |
| Inthanin | Car parking building S2 | 12 | inthanin-s2@example.test |
| KAMU KAMU | Car parking building S2 | 12 | kamu-s2@example.test |
| Fresh Me | Library building N10, floor 1 | 12 | freshme-library@example.test |
| Starbucks | Car parking building S2 | 12 | starbucks-s2@example.test |

The 60 items, descriptions, prices, availability and online reference photos are a **demo dataset**, not verified offerings or prices of the KMUTT branches. No vendor endorsement or real ordering integration is implied. The menu descriptions identify the data as illustrative. Prices in the JSON and database are integer satang; the frontend displays baht.

The source dataset is `database/kmutt-catalog.json`. Fresh laptop databases use it through `DEMO_CATALOG=kmutt` in the launcher. Restarting an initialized database does not reseed or erase changes. JSON development and regression fixtures retain their original catalog unless this environment variable is explicitly set.

## Explicit maintenance reset

The following command was used for the requested cleanup. Do not run it during ordinary startup: it replaces the catalog and removes orders, payments, queue rows, favorites, sessions and test accounts.

```powershell
node scripts/reset-campus-data.mjs --keep-real-accounts --confirm-reset
```

Run from the repository root while the laptop MySQL instance is running. It targets only `kmutt_cafeq` using the ignored `.local/server.json` connection details. It takes the demo transaction lock, writes a full JSON table backup under `.local/backups/`, then deletes and inserts rows in one transaction with foreign keys enabled. Failure rolls back the database transaction. Backups contain private account/session data and must remain local.

Real accounts (emails outside the reserved `@example.test` test domain) retain their user IDs, names, email addresses, password hashes and phone numbers. Each campus café uses its own demo owner account. Retained accounts remain customers and can be assigned to one café through Team.

The reset creates a fresh demo customer plus the five owner accounts above. Their password comes from `accountPassword` in `.local/server.json`. Everyone must log in again because the reset clears old sessions. Old unavailable basket entries are removed after the catalog reloads.

On an existing database, the backend automatically corrects the old reset that gave all five campus cafés to a single real account. It transfers ownership to the five dedicated accounts while preserving users, menu items and orders. A database reset is unnecessary.

## Verify

```sql
USE kmutt_cafeq;
SELECT c.id, c.name, COUNT(m.id) AS menu_count
FROM cafes c
LEFT JOIN menu_items m ON m.cafe_id = c.id
GROUP BY c.id, c.name;
```

Expect five stores with twelve items each immediately after the reset. `orders`, `payments`, `Order`, `OrderDetail` and `Queue` should be empty until new orders are placed. Check the café filter and all menu categories in the browser. Each owner account opens its assigned café on the store side.

Run `node --test backend/test/campusSeed.test.js backend/test/demo.test.js` and `npm.cmd --prefix frontend run build` to check catalog generation, account preservation and the ordering/team regressions.

## Menu photo sources

The demo uses a different online reference photo for each menu item. These images illustrate the type of food or drink.

### Café Amazon — Library N10

- Iced Black Coffee · [Photo source](https://www.kahve.com/blog/icerik/evde-soguk-kahve-nasil-yapilir-herkes-icin-basit-kolay-ve-uygulanabilir-receteler)
- Iced Espresso · [Photo source](https://www.tuktukthailosangeles.com/items/thai-iced-coffee)
- Iced Café Latte · [Photo source](https://allergy.doutor.co.jp/allergy_check/excelsior_caffe/item/detail/21001009/)
- Hot Cappuccino · [Photo source](https://www.hazipatika.com/taplalkozas/egeszseg_es_gasztronomia/cikkek/negy_egeszseges_koffeinital)
- Iced Mocha · [Photo source](https://www.ohhowcivilized.com/starbucks-iced-mocha/)
- Honey Black Coffee · [Photo source](https://poetti.ru/academy/offline/blog/recipes/kak-zavarit-kofe-v-chashke-prostoy-sposob-kotoryy-udivit-vkusom/)
- Green Tea with Milk · [Photo source](https://sorate.co/blogs/blog/recipe-iced-matcha-latte)
- Tea with Milk · [Photo source](https://teatheworld.com/blog/thai-iced-tea-recipe-ingredients-how-to-make-and-whats-in-thai-tea/)
- Iced Chocolate · [Photo source](https://cookpad.com/id/resep/15140620)
- Lemon Tea · [Photo source](https://thewoksoflife.com/lemon-iced-tea/)
- Coconut Cake · [Photo source](https://www.mrcook.app/pt-BR/recipes/0190ae80-d373-7c2a-81cf-28cc1ea4c625)
- Banana Muffin · [Photo source](https://redmoonbakery.com/products/banana-walnut)

### Inthanin — Car Park S2

- Iced Americano · [Photo source](https://www.seoul.co.kr/news/economy/2019/02/13/20190213800012)
- Iced Espresso · [Photo source](https://thaidata.uk/recipes/thai-iced-coffee/)
- Iced Café Latte · [Photo source](https://www.swiggy.com/city/ahmedabad/roastery-cultur-the-coffee-company-bodakdev-rest210151)
- Hot Cappuccino · [Photo source](https://loveswfl.co/coffee/cappuccino-recipe)
- Iced Mocha · [Photo source](https://www.cafecraving.com/blogs/news/how-to-make-a-better-iced-mocha-at-home-in-5-minutes-1)
- Hot Espresso · [Photo source](https://www.potterandreid.com/)
- Iced Thai Tea Latte · [Photo source](https://www.pasundanekspres.co/2023/12/05/cara-buat-thai-tea-creamy-ala-kafe/)
- Iced Green Tea Latte · [Photo source](https://www.wongnai.com/recipes?q=%E0%B8%8A%E0%B8%B2%E0%B9%80%E0%B8%82%E0%B8%B5%E0%B8%A2%E0%B8%A7)
- Iced Cocoa · [Photo source](https://daidokolog.pal-system.co.jp/recipe/8484)
- Iced Fresh Milk · [Photo source](https://cowboycolostrum.com/products/natures-gold-vanilla-stick-packs)
- Almond Croissant · [Photo source](https://note.com/good_parrot9915/n/nf6476ad6d1bc)
- Chocolate Brownie · [Photo source](https://sallysbakingaddiction.com/seriously-fudgy-homemade-brownies/comment-page-3/)

### KAMU KAMU — Car Park S2

- Original Milk Tea · [Photo source](https://thewoksoflife.com/hong-kong-milk-tea/)
- Pearl Milk Tea · [Photo source](https://feedgrump.com/taiwanese-milk-tea/)
- Brown Sugar Milk · [Photo source](https://www.ono-store.at/)
- Thai Milk Tea · [Photo source](https://www.thespiceodyssey.com/drink/Thai-iced-tea)
- Matcha Latte · [Photo source](https://waterstreetcoffee.com/blogs/news/matcha-at-water-street)
- Cocoa Milk · [Photo source](https://news.laodong.vn/gia-dinh-hon-nhan/cach-lam-cacao-sua-da-thom-beo-tai-nha-1698399.ldo)
- Jasmine Green Tea · [Photo source](https://www.kunafahabibi.com/product-page/iced-jasmine-greentea)
- Lemon Black Tea · [Photo source](https://baksotitoti.menumakanan.com/)
- Lychee Tea · [Photo source](https://chadathai.vn/products/tra-vai)
- Peach Tea · [Photo source](https://www.skinnymixes.com/blogs/tea-lemonade-recipes/peach-iced-tea)
- Matcha Cookie · [Photo source](https://recipe.rakuten.co.jp/recipe/1650009638/)
- Sesame Mochi · [Photo source](https://www.sbs.com.au/food/recipe/black-sesame-and-coconut-mochi/f63sv7wmk)

### Fresh Me — Library N10

- Fresh Milk Tea · [Photo source](https://www.mocktailsdaily.com/milk-tea-recipe/)
- Brown Sugar Pearl Milk · [Photo source](https://macaro-ni.jp/80492)
- Thai Tea · [Photo source](https://whiteonricecouple.com/thai-tea-recipe/)
- Matcha Milk · [Photo source](https://mattsfitchef.com/iced-matcha-latte/)
- Cocoa Milk · [Photo source](https://www.huongnghiepaau.com/cach-pha-cacao-sua-da-ngon-uong-la-ghien)
- Taro Milk · [Photo source](https://shop.possmei.com/products/taro-flavored-syrup)
- Jasmine Tea · [Photo source](https://7daysoftea.com/products/2024-amber-sunrise-sun-dried-black-tea-mini-cakes?srsltid=AfmBOoqRZlZiHI7eR0pWVx5Z40aLBuaAixWMU9WuzUD4IahCs_cXk0gl)
- Lemon Tea · [Photo source](https://www.everydaycheapskate.com/how-to-make-perfect-iced-tea/)
- Peach Tea · [Photo source](https://artfultea.com/products/ginger-peach-black-tea)
- Lychee Tea · [Photo source](https://www.momo.vn/page/9832109)
- Milk Bread Roll · [Photo source](https://toastpad.com/us/recipe/23706-hokkaido-japanese-milk-bread-rolls)
- Strawberry Cream Sandwich · [Photo source](https://tabelog.com/matome/25258/)

### Starbucks — Car Park S2

- Caffè Americano · [Photo source](https://www.cafepascale.com/product/cafe-americano/65)
- Iced Caffè Americano · [Photo source](https://www.paul.fr/americano-glace.html)
- Caffè Latte · [Photo source](https://craftcoffeespot.com/espresso/espresso-drinks/)
- Iced Caffè Latte · [Photo source](https://www.ubereats.com/au/store/leaf-cafe-lindfields/PWvivP5EWLeUByn02J9xeA)
- Cappuccino · [Photo source](https://www.kaufland.bg/recepti/tursene-recepti/recepta-detail.%D0%BA%D0%B0%D0%BF%D1%83%D1%87%D0%B8%D0%BD%D0%BE-%D0%BB%D0%B0%D1%82%D0%B5-%D0%B0%D1%80%D1%82.r_id%3DBG_1533.html)
- Caffè Mocha · [Photo source](https://www.folgerscoffee.com/coffee/recipes/holiday-seasonal/cafe-mocha-hot)
- Caramel Macchiato · [Photo source](https://nv.ua/food/eat/karamelnyy-makiato-doma-recept-ot-starbaks-50427880.html)
- Cold Brew · [Photo source](https://www.bonappetit.com/recipe/cold-brew-iced-coffee-concentrate)
- Matcha Latte · [Photo source](https://www.modernfarmhouseeats.com/starbucks-iced-matcha-latte/)
- Chocolate Cream · [Photo source](https://www.yahoo.com/lifestyle/seriously-addicting-copycat-starbucks-double-013320568.html)
- Blueberry Scone · [Photo source](https://cookidoo.international/recipes/recipe/zh-Hans/r796172)
- Cinnamon Roll · [Photo source](https://farmsteady.com/products/cinnamon-roll-making-kit)
