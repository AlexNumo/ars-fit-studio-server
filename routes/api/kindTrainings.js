const express = require('express');
const {
  listOfKindTrainings,
  addKindTraining,
  deleteKindTraining
} = require('../../controllers/kindTrainings');
const router = express.Router();

router.get('/', listOfKindTrainings);
router.post('/', addKindTraining);
router.put('/', deleteKindTraining);

module.exports = router;
