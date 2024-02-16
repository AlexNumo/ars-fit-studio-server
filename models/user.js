const {Schema, model} = require('mongoose');
const Joi = require("joi");
const {v4} = require('uuid');

const schema = new Schema(
    {
        access: {
            type: String,
            unique: false,
            default: 'client'
        },
        labelAuth: {
            type: String,
            unique: false,
            default: '-'
        },
        name: {
            type: String,
            unique: false,
            required: [true, 'Name is required'],
        },
        surname: {
            type: String,
            unique: false,
            default: '-'
        },
        birthday: {
            type: String,
            unique: false,
            default: '-'
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            default: '1111'
        },
        token: {
            type: String,
            default: null,
            },
        verify: {
            type: Boolean,
            default: false,
        },
        verificationToken: {
            type: String,
            default: function () {
            return v4();
            }
        },
        photo: {
            type: String,
            default: 'Відсутні дані'
        },
        tel: {
            type: String,
            required: [true, 'Tel is required'],
            unique:true
        },
        instagram: {
            type: String,
            unique: false,
            default: '-'
        },
        updateUser: {
            type: Boolean,
            default: false,
            unique: false
        },
        comments: {
            fromUserID: {
                type: String,
                unique: false
            },
            comment: {
                type: String,
                unique: false
            },
            date: {
                type: Date,
                unique: false
            },
            stars: {
                type: String,
                unique: false
            }
        },
        seasonTickets: [{
            name: {
                type: String,
                unique: false
            },
            limitOfTrainings: {
                type: Number,
                unique: false
            },
            remainderOfTrainings: {
                type: Number,
                unique: false
            },
            price: {
                type: Number,
                unique: false
            },
            kind: {
                type: String,
                unique: false
            },
            includes: {
                type: String,
                unique: false
            },
            dateOfBuying: {
                type: Date,
                unique: false
            },
            dateChoose: {
                type: Date,
                unique: false
            },
            confirmation: {
                type: Boolean,
                default: false,
                unique: false
            },
            infoTrainings: [{
                idTraining: {
                    type: String,
                    unique: false
                },
                day: {
                    type: String,
                    unique: false
                },
                time: {
                    type: String,
                    unique: false
                },
                kind_training: {
                    type: String,
                    unique: false
                },
                date: {
                    type: Date,
                    unique: false
                },
                coach: {
                    type: String,
                    default: "empty",
                    unique: false
                },  
                kind: {
                    type: String,
                    unique: false
                },
                visitTraining: {
                    type: Boolean,
                    default: false,
                    unique: false
                },
                canceledTraining: {
                    type: Boolean,
                    default: false,
                    unique: false
                },
                isTrainingReminderSent: {
                    type: Boolean,
                    default: false,
                    unique: false
                },
        }] 
        }],
        telegramBot: [{
            chatId: {
                type: Number,
                required: false
            },
            chatFirstName: {
                type: String
            },
            chatLastName: {
                type: String
            },
            chatUserName: {
                type: String
            },
            phoneNumber: {
                type: String,
                required: false
            }
        }],
        trainings: [{
            seasonTicketsID: {
                type: String,
                unique: false
            },
            day: {
                type: String,
                unique: false
            },
            time: {
                type: String,
                unique: false
            },
            kind_training: {
                type: String,
                unique: false
            },
            date: {
                type: Date,
                unique: false
            },
            coach: {
                type: String,
                default: "empty",
                unique: false
            },
            kind: {
                type: String,
                unique: false
            },
            visitTraining: {
                type: Boolean,
                default: false,
                unique: false
            },   
            canceledTraining: {
                type: Boolean,
                default: false,
                unique: false
            },
            isTrainingReminderSent: {
                type: Boolean,
                default: false,
                unique: false
            },  
        }]
    }, {timestamps: true});

const User = model('User', schema);

const schemaRegister = Joi.object({
  name: Joi.string().required(),
  tel: Joi.string().required(),
  password: Joi.string().required(),
});

const schemaLogin = Joi.object({
  tel: Joi.string().required(),
  password: Joi.string().required(),
});

module.exports = {
    User, schemaRegister, schemaLogin
}

