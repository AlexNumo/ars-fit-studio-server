const { Schedule } = require('../models/schedule');

const listData = async () => {
    return Schedule.find({}, {}, {});
}

const addData = async (req, res) => {
    const { id, day, time, kind_training, coach} = req;
    const find = await Schedule.findOne({ id });
    if (find) {
        await Schedule.findByIdAndDelete(find._id);
    }
    const newData = new Schedule({id, day, time, kind_training, coach});
    return await newData.save();
}

module.exports = {
    listData,
    addData,
}
