/**
 * Product discovery tests — scenario 1: search and filtering.
 */
const { api, createAdmin, seedProduct } = require('./helpers');

describe('Product discovery', () => {
  let adminToken;

  beforeAll(async () => {
    adminToken = await createAdmin();
  });

  test('search matches name and description, filters combine correctly', async () => {
    await seedProduct(adminToken, {
      name: 'Wireless Headphones',
      description: 'Over-ear headphones with noise cancelling.',
      category: 'Audio',
      price: 199.99,
      stock: 4,
    });
    await seedProduct(adminToken, {
      name: 'Bluetooth Speaker',
      description: 'Portable speaker with deep bass.',
      category: 'Audio',
      price: 59.99,
      stock: 0,
    });
    await seedProduct(adminToken, {
      name: 'Smartphone Pro',
      description: 'Flagship phone with an OLED display.',
      category: 'Phones',
      price: 999.99,
      stock: 3,
    });

    // name match
    let res = await api().get('/api/products?search=headphones');
    expect(res.status).toBe(200);
    expect(res.body.data.pagination.total).toBe(1);
    expect(res.body.data.products[0].name).toBe('Wireless Headphones');

    // description-only match
    res = await api().get('/api/products?search=bass');
    expect(res.body.data.pagination.total).toBe(1);
    expect(res.body.data.products[0].name).toBe('Bluetooth Speaker');

    // category + availability
    res = await api().get('/api/products?category=audio&inStock=true');
    expect(res.body.data.pagination.total).toBe(1);

    // price range (dollars -> cents)
    res = await api().get('/api/products?minPrice=50&maxPrice=200');
    expect(res.body.data.pagination.total).toBe(2);

    // sorting
    res = await api().get('/api/products?sortBy=price_asc');
    const prices = res.body.data.products.map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));

    res = await api().get('/api/products?sortBy=price_desc');
    expect(res.body.data.products[0].price).toBe(99999);

    // prices are stored as integer cents
    expect(Number.isInteger(res.body.data.products[0].price)).toBe(true);
  });

  test('pagination meta is returned and enforced', async () => {
    const res = await api().get('/api/products?limit=2&page=1');
    expect(res.status).toBe(200);
    expect(res.body.data.products.length).toBeLessThanOrEqual(2);
    expect(res.body.data.pagination).toMatchObject({
      page: 1,
      limit: 2,
      totalPages: expect.any(Number),
    });
  });

  test('invalid filter values are rejected with 400', async () => {
    const res = await api().get('/api/products?minPrice=abc');
    expect(res.status).toBe(400);
  });

  test('admin-only product management is enforced', async () => {
    const { token: customerToken } = await require('./helpers').registerUser();
    const denied = await api()
      .post('/api/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        name: 'Hacked Product',
        description: 'Should not be created by a customer.',
        category: 'Testing',
        price: 1,
        stock: 1,
      });
    expect(denied.status).toBe(403);
  });
});
