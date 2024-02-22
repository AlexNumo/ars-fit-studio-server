const express = require('express');
const {
  // performTest,
  listOfUsers,
  registrationUser,
  loginUser,
  authUser,
  upgradeUsers,
  upgradeUserPassword,
  logoutUser,
  signUpTraining,
  getTrainingsCoach,
  visitTraining,
  getAllCoaches,
  salaryCoach,
  seasonTicketsNotConfirm,
  seasonTicketsConfirm,
  coachTrainingsPeriod
} = require('../../controllers/users');
const router = express.Router();

// router.get('/', listDataUsers);
// router.get('/test', performTest);
router.get('/all', listOfUsers);
router.post('/registration', registrationUser);
router.post('/upgrade', upgradeUsers);
router.post('/upgrade/password', upgradeUserPassword);
router.post('/login', loginUser);
router.post('/auth', authUser);
router.put('/logout', logoutUser);
router.post('/signUpTraining', signUpTraining);
router.get('/coach', getAllCoaches);
router.post('/coach', getTrainingsCoach);
router.post('/coach/visit', visitTraining);
router.put('/coach/salary', salaryCoach);
router.get('/seasonTicketsConfirm', seasonTicketsNotConfirm);
router.post('/seasonTicketsConfirm', seasonTicketsConfirm);
router.put('/coach/trainings', coachTrainingsPeriod);

// router.get('/login', loginUser);


// router.put('/bot', botOn);

module.exports = router;
