const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const userRouter = require('./routes/api/user');
const seasonTicketsRouter = require('./routes/api/seasonTickets');
const schedulesRouter = require('./routes/api/schedule');
const kindTrainingsRouter = require('./routes/api/kindTrainings');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger(process.env.NODE_ENV === 'dev' ? 'dev' : 'tiny'));

// app.use('/user', userRouter);
app.use('/user', userRouter);
app.use('/seasonTickets', seasonTicketsRouter);
app.use('/schedule', schedulesRouter);
app.use('/kindTrainings', kindTrainingsRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' })
})

app.use((err, req, res, next) => {
  const {status = 500, message = "Internal Server Error"} = err;
  res.status(status).json({ message })
})

module.exports = app;
