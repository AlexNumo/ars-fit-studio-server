const scheduleService = require('../services/schedule.service');

const listOfSchedule = async (req, res, next) => {
    try {
        const all = await scheduleService.listData();
        res.json(all);
    } catch (e) {
        next(e);
    }
}

const addTrainingSchedule = async (req, res, next) => {
    try {
        const data = await scheduleService.addData(req.body);
        res.status(201).json(data);
    } catch (e) {
        if(e.message.includes('duplicate')){
            e.status = 400
        }
        next(e);
    }
}

module.exports = {
    listOfSchedule,
    addTrainingSchedule,
}
