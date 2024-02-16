const {Schema, model} = require('mongoose');

const schema = new Schema(
  {
    name: {
        type: String,
        unique: false,
    },
    limit: {
        type: Number,
        unique: false,
    },
    price: {
        type: Number,
        unique: false,
    },
    kind: {
      type: String,
      unique: false,
    },
    includes: {
      type: String,
      unique: false,
    },
  }, {timestamps: true});

const SeasonTickets = model('SeasonTickets', schema);

module.exports = {
    SeasonTickets,
}

