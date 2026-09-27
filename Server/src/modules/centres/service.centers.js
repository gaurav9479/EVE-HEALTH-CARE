// src/modules/centres/service.js
const DiagnosticCentre = require('../../models/DiagnosticCentre.model');
const DiagnosticTest = require('../../models/DiagnosticTest.model');
const CentreTest = require('../../models/CentreTest.model');
const mongoose = require('mongoose');


async function createCentre({ name, location }) {
  return DiagnosticCentre.create({ name, location });
}

async function patchCentre(id, updates) {
  const centre = await DiagnosticCentre.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
  if (!centre) {
    const err = new Error('Centre not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return centre;
}

/**
 * List active centres, optional case‑insensitive location filter
 */
async function listCentres(locationFilter, page = 1, limit = 20) {
  const query = { isActive: true };
  if (locationFilter) {
    const escaped = locationFilter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex meta
    query.location = { $regex: escaped, $options: 'i' };
  }
  const skip = (page - 1) * limit;
  const centres = await DiagnosticCentre.find(query).skip(skip).limit(limit).lean();
  const total = await DiagnosticCentre.countDocuments(query);
  return { data: centres, meta: { page, limit, total } };
}


async function getCentreById(id, isAdmin = false) {
  const centre = await DiagnosticCentre.findById(id).lean();
  if (!centre) {
    const err = new Error('Centre not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (!isAdmin && !centre.isActive) {
    const err = new Error('Centre not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  const offerings = await CentreTest.find({ centreId: centre._id, isAvailable: true })
    .populate('testId', 'name description')
    .lean();
  const enriched = {
    ...centre,
    offerings: offerings.map(o => ({
      testId: o.testId._id,
      name: o.testId.name,
      description: o.testId.description,
      price: require('../../lib/money').toRupeeString(o.pricePaise),
    })),
  };
  return enriched;
}

async function addOffering(centreId, { name, description, price }) {

  let test = await DiagnosticTest.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
  if (!test) {
    test = await DiagnosticTest.create({ name, description });
  }

  const exists = await CentreTest.findOne({ centreId, testId: test._id });
  if (exists) {
    const err = new Error('Centre already offers this test');
    err.status = 409;
    err.code = 'DUPLICATE_ERROR';
    throw err;
  }
  const pricePaise = require('../../lib/money').toPaise(price.toString());
  return CentreTest.create({ centreId, testId: test._id, pricePaise, isAvailable: true });
}

async function patchOffering(centreId, testId, { price, isAvailable }) {
  const update = {};
  if (price !== undefined) {
    update.pricePaise = require('../../lib/money').toPaise(price.toString());
  }
  if (isAvailable !== undefined) {
    update.isAvailable = isAvailable;
  }
  const offering = await CentreTest.findOneAndUpdate(
    { centreId, testId },
    { $set: update },
    { new: true, runValidators: true }
  );
  if (!offering) {
    const err = new Error('Offering not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return offering;
}

module.exports = {
  createCentre,
  patchCentre,
  listCentres,
  getCentreById,
  addOffering,
  patchOffering,
};
