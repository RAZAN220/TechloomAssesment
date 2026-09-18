/**
 * Cart tests — scenario 2: add and remove cart items (plus isolation + totals).
 */
const { api, createAdmin, seedProduct, registerUser, addToCart, getCart } = require('./helpers');

describe('Cart management', () => {
  let adminToken;
  let product;

  beforeAll(async () => {
    adminToken = await createAdmin();
    product = await seedProduct(adminToken, { price: 25, stock: 10 });
  });

  test('adds items, merges duplicates and computes totals server-side', async () => {
    const { token } = await registerUser();

    let res = await addToCart(token, product._id, 2);
    expect(res.status).toBe(200);
    expect(res.body.data.cart.items).toHaveLength(1);
    expect(res.body.data.cart.total).toBe(5000); // 2 × 2500 cents
    expect(res.body.data.cart.itemCount).toBe(2);

    res = await addToCart(token, product._id, 1);
    expect(res.body.data.cart.items[0].qty).toBe(3);
    expect(res.body.data.cart.total).toBe(7500);
  });

  test('updates quantity, removes on qty 0, and removes explicitly', async () => {
    const { token } = await registerUser();
    await addToCart(token, product._id, 2);

    let res = await api()
      .put(`/api/cart/items/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ qty: 4 });
    expect(res.body.data.cart.items[0].qty).toBe(4);

    res = await api()
      .put(`/api/cart/items/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ qty: 0 });
    expect(res.body.data.cart.items).toHaveLength(0);

    await addToCart(token, product._id, 1);
    res = await api()
      .delete(`/api/cart/items/${product._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.cart.items).toHaveLength(0);
    expect(res.body.data.cart.total).toBe(0);
  });

  test('rejects quantities beyond available stock and unknown products', async () => {
    const { token } = await registerUser();

    const tooMany = await addToCart(token, product._id, 99);
    expect(tooMany.status).toBe(422);
    expect(tooMany.body.message).toMatch(/only 10 unit/i);

    const unknown = await addToCart(token, 'f'.repeat(24), 1);
    expect(unknown.status).toBe(404);

    const invalid = await addToCart(token, 'not-an-object-id', 1);
    expect(invalid.status).toBe(400);
  });

  test('carts are private to each user', async () => {
    const alice = await registerUser();
    const bob = await registerUser();

    await addToCart(alice.token, product._id, 3);

    const aliceCart = await getCart(alice.token);
    const bobCart = await getCart(bob.token);

    expect(aliceCart.body.data.cart.itemCount).toBe(3);
    expect(bobCart.body.data.cart.itemCount).toBe(0);

    const anon = await api().get('/api/cart');
    expect(anon.status).toBe(401);
  });
});
