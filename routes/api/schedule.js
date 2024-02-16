const express = require('express');
const {
  listOfSchedule,
  addTrainingSchedule
} = require('../../controllers/schedule');
const router = express.Router();

router.get('/', listOfSchedule);
router.post('/', addTrainingSchedule);

module.exports = router;
