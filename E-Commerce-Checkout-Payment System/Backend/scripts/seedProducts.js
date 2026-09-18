#!/usr/bin/env node
/**
 * Sample-data seeder — for local development, demos and reviewers.
 *
 * Idempotent: products are matched by name, so running it repeatedly refreshes
 * prices/stock/descriptions instead of creating duplicates. `--reset` first
 * removes the sample products (and drops them from every cart, mirroring the
 * admin delete endpoint).
 *
 * Usage (from the Backend folder):
 *   npm run seed                  # create/refresh the sample catalogue
 *   npm run seed -- --reset       # remove sample products, then re-create them
 *   npm run seed -- --no-images   # leave product images empty (offline-friendly)
 *   npm run seed -- --no-users    # skip the demo accounts
 *
 * All monetary values are integers in minor units (cents), matching the API.
 * Product images are placeholder URLs; the UI falls back to an icon when a
 * placeholder cannot be reached.
 */
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');
const User = require('../src/models/User');

const WITH_IMAGES = !process.argv.includes('--no-images');
const WITH_USERS = !process.argv.includes('--no-users');
const RESET = process.argv.includes('--reset');

/** Dollars (as written in the catalogue below) -> integer cents. */
const toCents = (dollars) => Math.round(dollars * 100);

/**
 * Sample catalogue: 18 products across 6 categories, including one
 * out-of-stock and one low-stock item so availability/filters can be demoed.
 */
const SAMPLE_PRODUCTS = [
  // --- Audio ---
  {
    slug: 'aurora-headphones',
    name: 'Aurora Wireless Headphones',
    description:
      'Over-ear wireless headphones with adaptive noise cancelling and 40-hour battery life.',
    category: 'Audio',
    price: 199.99,
    stock: 24,
  },
  {
    slug: 'pulse-speaker',
    name: 'Pulse Bluetooth Speaker',
    description: 'Portable water-resistant speaker with deep bass and 18-hour playback.',
    category: 'Audio',
    price: 59.99,
    stock: 60,
  },
  {
    slug: 'echobuds-pro',
    name: 'EchoBuds Pro Earbuds',
    description: 'True wireless earbuds with active noise cancelling and a wireless charging case.',
    category: 'Audio',
    price: 129.5,
    stock: 35,
  },
  {
    slug: 'studio-monitors',
    name: 'Studio Monitor Speakers (Pair)',
    description: 'Two-way near-field studio monitors for accurate mixing and reference listening.',
    category: 'Audio',
    price: 349,
    stock: 0, // out of stock on purpose — exercises the availability filter/badge
  },

  // --- Phones ---
  {
    slug: 'nova-x9',
    name: 'Nova X9 Smartphone',
    description: 'Flagship 6.7-inch OLED smartphone with a triple camera and 256 GB of storage.',
    category: 'Phones',
    price: 999.99,
    stock: 12,
  },
  {
    slug: 'nova-lite-5g',
    name: 'Nova Lite 5G',
    description: 'Affordable 5G phone with a 90 Hz display and an all-day 5000 mAh battery.',
    category: 'Phones',
    price: 329,
    stock: 40,
  },
  {
    slug: 'pixelpro-tablet',
    name: 'PixelPro Tablet 11',
    description: 'An 11-inch tablet with stylus support for note-taking, sketching and reading.',
    category: 'Phones',
    price: 549,
    stock: 15,
  },

  // --- Computers ---
  {
    slug: 'carbon-ultrabook',
    name: 'Carbon Ultrabook 14',
    description: 'A 14-inch ultralight laptop with 16 GB RAM, a 1 TB SSD and 12-hour battery life.',
    category: 'Computers',
    price: 1299,
    stock: 7,
  },
  {
    slug: 'tkl-keyboard',
    name: 'Mechanical Keyboard TKL',
    description: 'Hot-swappable tenkeyless mechanical keyboard with tactile switches and per-key RGB.',
    category: 'Computers',
    price: 119,
    stock: 45,
  },
  {
    slug: 'precision-mouse',
    name: 'Precision Wireless Mouse',
    description: 'Ergonomic wireless mouse with an 8000 DPI sensor and silent click buttons.',
    category: 'Computers',
    price: 49.95,
    stock: 80,
  },
  {
    slug: 'monitor-4k-27',
    name: '27-inch 4K IPS Monitor',
    description: 'A 27-inch 4K IPS monitor with 99% sRGB coverage and USB-C power delivery.',
    category: 'Computers',
    price: 429,
    stock: 18,
  },

  // --- Wearables ---
  {
    slug: 'vitals-watch',
    name: 'Vitals Smartwatch',
    description: 'Fitness smartwatch with SpO2, built-in GPS and a 10-day battery life.',
    category: 'Wearables',
    price: 229,
    stock: 30,
  },
  {
    slug: 'trailrunner-gps',
    name: 'TrailRunner GPS Watch',
    description: 'Rugged multisport GPS watch with a barometric altimeter and offline maps.',
    category: 'Wearables',
    price: 399,
    stock: 9,
  },

  // --- Home ---
  {
    slug: 'lumen-bulbs',
    name: 'Lumen Smart Bulb (4-pack)',
    description: 'Wi-Fi smart bulbs with 16 million colours and voice assistant support.',
    category: 'Home',
    price: 39.99,
    stock: 120,
  },
  {
    slug: 'brewmaster-espresso',
    name: 'BrewMaster Espresso Machine',
    description: 'A 15-bar espresso machine with a built-in conical burr grinder and milk frother.',
    category: 'Home',
    price: 649,
    stock: 6,
  },
  {
    slug: 'airpurify-mini',
    name: 'AirPurify Mini',
    description: 'Compact HEPA air purifier for rooms up to 40 m², with a quiet night mode.',
    category: 'Home',
    price: 189,
    stock: 22,
  },

  // --- Accessories ---
  {
    slug: 'gan-charger-100w',
    name: 'USB-C 100W GaN Charger',
    description: 'Compact GaN charger with two USB-C ports and foldable prongs for travel.',
    category: 'Accessories',
    price: 45,
    stock: 150,
  },
  {
    slug: 'voyager-backpack',
    name: 'Voyager Laptop Backpack',
    description: 'Water-resistant 22 L backpack with a padded 16-inch laptop sleeve and USB port.',
    category: 'Accessories',
    price: 89,
    stock: 55,
  },
];

/** Product-image URL per product — uses keyword-based picsum seeds so the
 *  placeholder is visually themed to the product category rather than a
 *  random picture. Falls back to a neutral placeholder if images are disabled. */
const IMAGE_THEME = {
  'aurora-headphones':   'headphones',
  'pulse-speaker':        'speaker',
  'echobuds-pro':         'earbuds',
  'studio-monitors':      'studio-monitors',
  'nova-x9':              'smartphone',
  'nova-lite-5g':         'smartphone',
  'pixelpro-tablet':      'tablet',
  'carbon-ultrabook':     'laptop',
  'tkl-keyboard':         'keyboard',
  'precision-mouse':      'computer-mouse',
  'monitor-4k-27':        'monitor',
  'vitals-watch':         'smartwatch',
  'trailrunner-gps':      'gps-watch',
  'lumen-bulbs':          'light-bulb',
  'brewmaster-espresso':  'espresso-machine',
  'airpurify-mini':       'air-purifier',
  'gan-charger-100w':     'charger',
  'voyager-backpack':     'laptop-backpack',
};

const imageFor = (slug) =>
  WITH_IMAGES
    ? `https://picsum.photos/seed/${IMAGE_THEME[slug] || slug}/600/400`
    : '';

/** Builds the document written to Mongo from a catalogue entry. */
const toProductDoc = (item) => ({
  name: item.name,
  description: item.description,
  category: item.category,
  price: toCents(item.price),
  stock: item.stock,
  image: imageFor(item.slug),
});

/**
 * Creates missing sample products and refreshes the ones that already exist.
 * @returns {Promise<{created: number, updated: number}>}
 */
const seedProducts = async () => {
  let created = 0;
  let updated = 0;

  for (const item of SAMPLE_PRODUCTS) {
    const existing = await Product.findOne({ name: item.name });
    if (existing) {
      // Refresh so re-running picks up edited prices/stock/descriptions
      Object.assign(existing, toProductDoc(item));
      await existing.save(); // validators apply on save
      updated += 1;
    } else {
      await Product.create(toProductDoc(item));
      created += 1;
    }
  }

  return { created, updated };
};

/**
 * Removes only the products defined in this file (never the whole catalogue)
 * and drops them from every cart, mirroring productService.deleteProduct —
 * otherwise carts would keep referencing deleted products.
 */
const removeSampleProducts = async () => {
  const names = SAMPLE_PRODUCTS.map((item) => item.name);
  const removed = await Product.find({ name: { $in: names } }).select('_id').lean();
  if (removed.length === 0) return 0;

  const ids = removed.map((doc) => doc._id);
  await Cart.updateMany({}, { $pull: { items: { product: { $in: ids } } } });
  const { deletedCount } = await Product.deleteMany({ _id: { $in: ids } });
  return deletedCount || 0;
};

/**
 * Demo accounts. There is intentionally no admin sign-up endpoint, so the
 * admin UI (/admin/products) is unreachable without one. These are for
 * development/demo only — never seed them into a real deployment.
 */
const DEMO_USERS = [
  { name: 'Demo Admin', email: 'admin@techmart.local', password: 'Admin123!', role: 'admin' },
  {
    name: 'Demo Customer',
    email: 'customer@techmart.local',
    password: 'Customer123!',
    role: 'customer',
  },
];

/**
 * Creates the demo accounts when missing and repairs their role when needed.
 * Uses the document API (not findOneAndUpdate) so the bcrypt pre-save hook in
 * the User model always runs and passwords are never stored in plain text.
 * @returns {Promise<Array<{email: string, role: string, status: string}>>}
 */
const ensureUsers = async () => {
  const results = [];

  for (const demo of DEMO_USERS) {
    const existing = await User.findOne({ email: demo.email });

    if (!existing) {
      await User.create(demo); // hashes the password via pre('save')
      results.push({ email: demo.email, role: demo.role, status: 'created' });
      continue;
    }

    if (existing.role !== demo.role) {
      existing.role = demo.role;
      await existing.save(); // password untouched, so no re-hash
      results.push({ email: demo.email, role: demo.role, status: 'role updated' });
    } else {
      results.push({ email: demo.email, role: demo.role, status: 'already exists' });
    }
  }

  return results;
};

(async () => {
  await connectDB();
  console.log(`\n🌱 Seeding sample data into "${mongoose.connection.name}"...\n`);

  if (RESET) {
    const removed = await removeSampleProducts();
    console.log(`   --reset: removed ${removed} sample product(s) and cleared them from carts`);
  }

  const { created, updated } = await seedProducts();
  const total = await Product.countDocuments();
  const categories = (await Product.distinct('category')).sort();

  console.log(`✅ Products: ${created} created, ${updated} refreshed (catalogue total: ${total})`);
  console.log(`   Categories: ${categories.join(', ')}`);

  const outOfStock = await Product.countDocuments({ stock: 0 });
  console.log(`   Out of stock: ${outOfStock} | In stock: ${total - outOfStock}`);

  if (WITH_IMAGES) {
    console.log('   Images: placeholder URLs (the UI falls back to an icon if they cannot load)');
  } else {
    console.log('   Images: disabled (--no-images)');
  }

  if (WITH_USERS) {
    console.log('\n👤 Demo accounts:');
    const users = await ensureUsers();
    users.forEach((user) => console.log(`   ${user.email} — ${user.status} [${user.role}]`));

    console.log('\n   Sign-in details (development/demo data only):');
    DEMO_USERS.forEach((user) =>
      console.log(`     ${user.role.padEnd(8)} ${user.email}  /  ${user.password}`)
    );
  }

  console.log('\nDone. Start the app with `npm run dev` (from the project root).\n');

  await mongoose.disconnect();
})().catch(async (err) => {
  console.error('\n❌ Seed failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
