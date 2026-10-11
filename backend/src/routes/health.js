const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    time: new Date().toISOString(),
    service: 'meta-leads-backend',
  });
});

module.exports = router;
