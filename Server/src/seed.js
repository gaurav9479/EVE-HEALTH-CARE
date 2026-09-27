// src/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('./config');
const User = require('./models/User.model');
const DiagnosticCentre = require('./models/DiagnosticCentre.model');
const DiagnosticTest = require('./models/DiagnosticTest.model');
const CentreTest = require('./models/CentreTest.model');

async function run() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');


    const adminEmail = 'admin@example.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const adminHash = await bcrypt.hash('AdminPass123', 10);
      admin = await User.create({ name: 'Admin', email: adminEmail, passwordHash: adminHash, role: 'ADMIN' });
      console.log('Created admin user');
    } else {
      console.log('Admin user already exists');
    }


    const userEmail = 'user@example.com';
    let user = await User.findOne({ email: userEmail });
    if (!user) {
      const userHash = await bcrypt.hash('UserPass123', 10);
      user = await User.create({ name: 'Normal User', email: userEmail, passwordHash: userHash, role: 'USER' });
      console.log('Created normal user');
    } else {
      console.log('Normal user already exists');
    }


    const centreData = [
      { name: 'City Health Centre', location: 'New Delhi' },
      { name: 'Metro Diagnostic', location: 'Bangalore' },
    ];
    const centres = [];
    for (const c of centreData) {
      let centre = await DiagnosticCentre.findOne({ name: c.name });
      if (!centre) {
        centre = await DiagnosticCentre.create(c);
        console.log(`Created centre ${c.name}`);
      }
      centres.push(centre);
    }


    const testNames = ['Blood Sugar', 'Lipid Panel', 'CBC', 'Thyroid'];
    const tests = [];
    for (const name of testNames) {
      let test = await DiagnosticTest.findOne({ name });
      if (!test) {
        test = await DiagnosticTest.create({ name, description: `${name} description` });
        console.log(`Created test ${name}`);
      }
      tests.push(test);
    }


    for (const centre of centres) {
      for (const test of tests) {
        const exists = await CentreTest.findOne({ centreId: centre._id, testId: test._id });
        if (!exists) {

          const pricePaise = 1000 + Math.floor(Math.random() * 500);
          await CentreTest.create({ centreId: centre._id, testId: test._id, pricePaise, isAvailable: true });
          console.log(`Added offering ${test.name} to ${centre.name}`);
        }
      }
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seed error', err);
    process.exit(1);
  }
}

run();
