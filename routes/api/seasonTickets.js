const express = require('express');
const {
  listOfSeasonTickets,
  buySeasonTicket
} = require('../../controllers/seasonTickets');
const router = express.Router();

router.get('/', listOfSeasonTickets);
router.post('/', buySeasonTicket);

module.exports = router;
