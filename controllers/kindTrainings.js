const kindTrainingsService = require('../services/kindTrainings.service');

const listOfKindTrainings = async (req, res, next) => {
    try {
        const all = await kindTrainingsService.listKindTrainee();
        res.json(all);
    } catch (e) {
        next(e);
    }
}

const addKindTraining = async (req, res, next) => {
    try {
        const data = await kindTrainingsService.addKindTrainee(req.body);
        res.status(201).json(data);
    } catch (e) {
        if(e.message.includes('duplicate')){
            e.status = 400
        }
        next(e);
    }
}

const deleteKindTraining = async (req, res, next) => {
    try {
        const data = await kindTrainingsService.deleteKindTrainee(req.body);
        res.status(201).json(data);
    } catch (e) {
        next(e);
    }
}

module.exports = {
    listOfKindTrainings, addKindTraining, deleteKindTraining
}
