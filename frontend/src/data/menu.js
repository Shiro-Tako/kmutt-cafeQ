export const cafes = ['Cafe Rung', 'Food Court'];

export const menu = [
  { id: 'americano', name: 'Iced Americano', category: 'Coffee', price: 55, image: 'c78c7.png', description: 'Double espresso and water, served cold', cafe: 'Cafe Rung' },
  { id: 'sweet-heaven', name: 'Iced Coffee Sweet Heaven', category: 'Coffee', price: 70, image: 'e532a.png', description: 'Double espresso with condensed milk, served cold', cafe: 'Cafe Rung' },
  { id: 'cappuccino', name: 'Hot Cappuccino', category: 'Coffee', price: 40, image: 'dda84.png', description: 'Double espresso and fresh milk, served hot', cafe: 'Cafe Rung' },
  { id: 'iced-cappuccino', name: 'Iced Cappuccino', category: 'Coffee', price: 45, image: '6f32b.png', description: 'Double espresso and fresh milk, served cold', cafe: 'Cafe Rung' },
  { id: 'coffee-lemonade', name: 'Iced Coffee Lemonade', category: 'Coffee', price: 55, image: 'dd102.png', description: 'Double espresso with fresh lemonade, served cold', cafe: 'Cafe Rung' },
  { id: 'mocha', name: 'Iced Mocha', category: 'Coffee', price: 55, image: '2532d.png', description: 'Double espresso and chocolate, served cold', cafe: 'Cafe Rung' },
  { id: 'lemonade', name: 'Iced Lemonade', category: 'Tea & More', price: 45, image: 'c468c.png', description: 'Fresh lemon over ice', cafe: 'Cafe Rung' },
  { id: 'iced-chocolate', name: 'Iced Chocolate', category: 'Tea & More', price: 60, image: 'd790d.png', description: 'Chocolate and milk, served cold', cafe: 'Cafe Rung' },
  { id: 'hot-chocolate', name: 'Hot Chocolate', category: 'Tea & More', price: 50, image: '39bbc.png', description: 'Warm chocolate and steamed milk', cafe: 'Cafe Rung' },
  { id: 'lemon-tea', name: 'Iced Lemon Tea', category: 'Tea & More', price: 55, image: 'dd102.png', description: 'Chilled tea with lemon', cafe: 'Cafe Rung' },
  { id: 'thai-tea', name: 'Thai Milk Tea', category: 'Tea & More', price: 40, description: 'Thai tea with milk over ice', cafe: 'Food Court' },
  { id: 'cake', name: 'Chocolate Cake', category: 'Snacks', price: 65, description: 'A slice of chocolate cake', cafe: 'Food Court' },
];

export const getCafe = (item) => item.cafe;
export const getItem = (id) => menu.find((item) => item.id === id);
export const baht = (price) => `฿${price.toLocaleString('en-TH')}`;

export const initialOrders = [
  { id: 12, customer: 'Somchai P.', time: '10:42 AM', date: '28/09', cafe: cafes[0], status: 'Waiting', items: { lemonade: 2, 'sweet-heaven': 1 } },
  { id: 11, customer: 'Nattaya K.', time: '10:38 AM', date: '28/09', cafe: cafes[0], status: 'Waiting', items: { 'hot-chocolate': 2, 'thai-tea': 1 } },
  { id: 10, customer: 'Priya S.', time: '10:35 AM', date: '28/09', cafe: cafes[0], status: 'Waiting', items: { americano: 1, cake: 1 } },
  { id: 9, customer: 'Somchai P.', time: '10:25 AM', date: '28/09', cafe: cafes[0], status: 'Preparing', items: { cappuccino: 1 } },
  { id: 8, customer: 'Somchai P.', time: '10:20 AM', date: '28/09', cafe: cafes[1], status: 'Ready', items: { 'lemon-tea': 2 } },
  { id: 7, customer: 'Somchai P.', time: '10:15 AM', date: '28/09', cafe: cafes[0], status: 'Done', items: { 'iced-chocolate': 1 } },
  { id: 6, customer: 'Somchai P.', time: '9:50 AM', date: '27/09', cafe: cafes[0], status: 'Done', items: { mocha: 2 } },
  { id: 5, customer: 'Somchai P.', time: '9:40 AM', date: '26/09', cafe: cafes[0], status: 'Done', items: { 'sweet-heaven': 1 } },
];
