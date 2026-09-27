const router = require('express').Router();
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const path = require('path');
const spec = yaml.load(path.join(__dirname, '../openapi.yaml'));
router.use('/', swaggerUi.serve, swaggerUi.setup(spec));
module.exports = router;
