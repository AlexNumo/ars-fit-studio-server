const { KindTrainings } = require('../models/kindTrainings');
const {createError} = require("../helpers/errors");

const listKindTrainee = async () => {
    return await KindTrainings.find({}, {}, {});
}

const addKindTrainee = async (req, res) => {
    console.log(req)
    const { id, value, label } = req;
    const find = await KindTrainings.findOne({ id });
    if (find) {
        throw createError(409, 'Kind-Trainee in use');
    }
    const newCoach = new KindTrainings({id, value, label});
    return await newCoach.save();
}

const deleteKindTrainee = async (req, res) => {
    const { id } = req;
       const find = await KindTrainings.findOne({ id });
    if (find) {
        await KindTrainings.findByIdAndDelete(find._id);
    }
    return find;

}

module.exports = {
    listKindTrainee, addKindTrainee, deleteKindTrainee
}
