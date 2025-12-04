const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { User, Product, Order, PasswordResetRequest } = require('./models');
const connectDB = require('./config/database');

// Sample products
const sampleProducts = [
  {
    reference: '1-405',
    nameEn: 'ProMar 200 Interior Latex',
    nameFr: 'ProMar 200 Latex Intérieur',
    size: '1L',
    price: 11.30,
    allowedQuantities: [10, 30, 50, 60],
    relatedProducts: ['8-814', '8-810']
  },
  {
    reference: '1-335',
    nameEn: 'Duration Home Interior',
    nameFr: 'Duration Home Intérieur',
    size: '1L',
    price: 9.99,
    allowedQuantities: [5, 10, 15, 20],
    relatedProducts: ['C-658']
  },
  {
    reference: 'SW7005',
    nameEn: 'Alabaster',
    nameFr: 'Albâtre',
    color: '#F0EDE5',
    size: '1L',
    price: 11.99,
    allowedQuantities: [1, 5, 10, 20],
    relatedProducts: ['SW7006', 'SW7008']
  },
  {
    reference: 'C-658',
    nameEn: 'Emerald Urethane Trim Enamel',
    nameFr: 'Émail Urethane Emerald',
    size: '1L',
    price: 11.99,
    allowedQuantities: [5, 10, 15, 20],
    relatedProducts: ['1-335']
  },
  {
    reference: 'L-202',
    nameEn: 'SuperPaint Interior Acrylic',
    nameFr: 'SuperPaint Acrylique Intérieur',
    size: '1L',
    price: 11.99,
    allowedQuantities: [5, 10, 15, 20],
    relatedProducts: ['8-814']
  },
  {
    reference: '8-814',
    nameEn: 'Premium Wall & Wood Primer',
    nameFr: 'Primaire Premium Mur & Bois',
    size: '1L',
    price: 8.99,
    allowedQuantities: [5, 10, 20, 30],
    relatedProducts: ['1-405', 'L-202']
  },
  {
    reference: '8-810',
    nameEn: 'Multi-Purpose Latex Primer',
    nameFr: 'Primaire Latex Multi-Usage',
    size: '1L',
    price: 7.99,
    allowedQuantities: [10, 20, 30, 40],
    relatedProducts: ['1-405']
  },
  {
    reference: 'SW7006',
    nameEn: 'Extra White',
    nameFr: 'Blanc Extra',
    color: '#FFFFFF',
    size: '1L',
    price: 10.99,
    allowedQuantities: [1, 5, 10, 20],
    relatedProducts: ['SW7005']
  },
  {
    reference: 'SW7008',
    nameEn: 'Alabaster Light',
    nameFr: 'Albâtre Clair',
    color: '#F5F2EA',
    size: '1L',
    price: 11.99,
    allowedQuantities: [1, 5, 10, 20],
    relatedProducts: ['SW7005', 'SW7006']
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await PasswordResetRequest.deleteMany({});

    console.log('👤 Creating admin user...');
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const admin = await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@sherwin.com',
      password: adminPassword,
      role: 'admin'
    });
    console.log(`   Admin created: ${admin.email}`);

    console.log('👥 Creating sample users...');
    const users = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        role: 'user'
      },
      {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        password: 'password123',
        role: 'user',
        passwordResetRequested: true,
        passwordResetRequestedAt: new Date()
      }
    ]);
    console.log(`   Created ${users.length} users`);

    // Create password reset request for Bob
    await PasswordResetRequest.create({
      user: users[2]._id,
      status: 'pending'
    });
    console.log('   Created password reset request for Bob');

    console.log('📦 Creating products...');
    const products = await Product.create(sampleProducts);
    console.log(`   Created ${products.length} products`);

    console.log('🛒 Creating sample orders...');
    const order1 = await Order.create({
      user: users[0]._id,
      items: [
        {
          product: products[0]._id,
          reference: products[0].reference,
          name: products[0].nameEn,
          size: products[0].size,
          quantity: 10,
          price: products[0].price,
          subtotal: products[0].price * 10
        },
        {
          product: products[2]._id,
          reference: products[2].reference,
          name: products[2].nameEn,
          size: products[2].size,
          quantity: 5,
          price: products[2].price,
          subtotal: products[2].price * 5
        }
      ],
      total: (products[0].price * 10) + (products[2].price * 5),
      status: 'pending'
    });

    const order2 = await Order.create({
      user: users[1]._id,
      items: [
        {
          product: products[5]._id,
          reference: products[5].reference,
          name: products[5].nameEn,
          size: products[5].size,
          quantity: 20,
          price: products[5].price,
          subtotal: products[5].price * 20
        }
      ],
      total: products[5].price * 20,
      status: 'confirmed'
    });

    console.log('   Created 2 sample orders');

    console.log('\n✅ Database seeded successfully!\n');
    console.log('📋 Test Credentials:');
    console.log('   Admin: admin@sherwin.com / admin123');
    console.log('   User:  john@example.com / password123');
    console.log('   User:  jane@example.com / password123');
    console.log('   User:  bob@example.com / password123 (has password reset request)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
