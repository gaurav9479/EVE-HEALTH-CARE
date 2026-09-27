
const express = require('express');
const validate = require('../middleware/validate.middleware');
const { requireRole, verifyToken } = require('../middleware/auth.middleware');
const { createCentreSchema, patchCentreSchema } = require('../schemas/centres');
const { addOfferingSchema, patchOfferingSchema } = require('../schemas/offerings');
const centreService = require('../modules/centres/service.centers');
const redisClient = require('../lib/redisClient');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const result = await centreService.listCentres(req.query.location, page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const centre = await centreService.getCentreById(req.params.id, false);
    res.json({ centre });
  } catch (err) {
    next(err);
  }
});


router.post('/', verifyToken, requireRole('ADMIN'), validate(createCentreSchema), async (req, res, next) => {
  try {
    const centre = await centreService.createCentre(req.validated);
    res.status(201).json({ centre });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', verifyToken, requireRole('ADMIN'), validate(patchCentreSchema), async (req, res, next) => {
  try {
    const centre = await centreService.patchCentre(req.params.id, req.validated);
    res.json({ centre });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/tests', verifyToken, requireRole('ADMIN'), validate(addOfferingSchema), async (req, res, next) => {
  try {
    const offering = await centreService.addOffering(req.params.id, req.validated);
    res.status(201).json({ offering });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/tests/:testId', verifyToken, requireRole('ADMIN'), validate(patchOfferingSchema), async (req, res, next) => {
  try {
    const offering = await centreService.patchOffering(req.params.id, req.params.testId, req.validated);
    res.json({ offering });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
