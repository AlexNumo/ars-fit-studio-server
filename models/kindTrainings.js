const {Schema, model} = require('mongoose');

const schema = new Schema(
    {
      id: {
          type: String,
          unique: false
      },
      value: {
          type: String,
          unique: false
        },
      label: {
          type: String,
          unique: false
      },
    }
);

const KindTrainings = model('kindTrainings', schema);

module.exports = {
    KindTrainings,
}

