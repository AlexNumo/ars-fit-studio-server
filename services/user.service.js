const { User } = require('../models/user');
const { arsFitStudioDataBase, client } = require('./mongoDB/mongoDB');
const bcrypt = require('bcryptjs');
const {createError} = require('../helpers/errors');
const {SECRET_KEY} = require("../helpers/env");
const jwt = require('jsonwebtoken');

const test = async () => {
    const testik = 'working'
    return testik;
}

const listData = async () => {
    try {
        const users = await arsFitStudioDataBase.find({}).toArray();
        // console.log(users)
        return users;
    } catch (err) {
        console.log(err);
    } finally {
        await client.close();
    }
};

const listCoaches = async () => {
    const admin = 'admin';
    const coach = 'coach';
    const coaches = await User.find({ access: coach }).select('name surname labelAuth tel instagram comments');
    const admins = await User.find({ access: admin }).select('name surname labelAuth tel instagram comments');

    const coachInformation = coaches.map(coach => {
        return {
            type: 'coach',
            name: coach.name,
            surname: coach.surname,
            labelAuth: coach.labelAuth,
            tel: coach.tel,
            instagram: coach.instagram,
            comments: coach.comments.length > 0 ? coach.comments : '-'
        };
    });
// labelAuth
    const adminInformation = admins.map(admin => {
        return {
            type: 'admin',
            name: admin.name,
            surname: admin.surname,
            labelAuth: admin.labelAuth,
            tel: admin.tel,
            instagram: admin.instagram,
            comments: admin.comments.length > 0 ? admin.comments : '-'
        };
    });

    const combinedArray = [...coachInformation, ...adminInformation];

    return combinedArray;
};

const registrationUser = async (userData) => {
    const result = await User.findOne({ tel: userData.tel });
    if(result) {
        throw createError(409, 'Telephone in use');
    }
    const password = userData.password;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user =
        await User.create({
            ...userData,
            password: hashedPassword,
        });

    return user;
}

const loginUser = async ({ tel, password }) => {
    const user = await User.findOne({ tel });
    if(!user) {
        throw createError(401, 'Login or password is wrong');
    }
    const isValid = await bcrypt.compare(password, user.password);
    if(!isValid) {
        throw createError(401, 'Login or password is wrong');
    }
    const payload = {
        id: user._id,
    };
    const token = jwt.sign(payload, SECRET_KEY, {expiresIn: '1h'});
    await User.findByIdAndUpdate(user._id, {token})
    return user;
}

const upgradeUsers = async (userData, res) => {
    const { id } = userData;
    const keys = Object.keys(userData);
    const values = Object.values(userData);
    const fieldKey = keys[1];
    const fieldName = values[1];

    const find = await User.findOne({_id: id});

    if (find) {
        const updateObject = {};
        updateObject[fieldKey] = fieldName;

        return await User.findOneAndUpdate(
            {_id: id},
            {$set: updateObject},
            {new: true}
        );
    }
    return;
}

const upgradeUserPassword = async (userData, res) => {
    const { id, currentPassword, newPassword } = userData;
    const user = await User.findOne({ _id: id });

    if (user) {
        const hashedPassword = user.password;
        const passwordsMatch = await bcrypt.compare(currentPassword, hashedPassword);
        // console.log(passwordsMatch)

        if (passwordsMatch) {
            const newPasswordsMatch = await bcrypt.compare(newPassword, hashedPassword);
            // console.log(newPasswordsMatch)
            if (newPasswordsMatch !== true) {
                const hashedNewPassword = await bcrypt.hash(newPassword, 10);
                const updatedUser = await User.findOneAndUpdate(
                    { _id: id },
                    { $set: { password: hashedNewPassword } },
                    { new: true }
                );

                // Ви можете додати додаткові дії або повідомлення, якщо необхідно
                return updatedUser;
            } else {
                return { error: 'Новий пароль співпадає з поточним паролем' };
            }
        } else {
            return { error: 'Поточний пароль невірний' };
        }
    } else {
        return { error: 'Користувача не знайдено' };
    }
};

const signUpTrainingFunction = async (userData) => {
    let messages = {};
    const existingTraining = await User.findOne({
        _id: userData.userID,
        'trainings.day': userData.day,
        'trainings.time': userData.time,
        'trainings.kind_trainee': userData.kind_trainee,
        'trainings.coach': userData.name_Coach,
        'trainings.kind': userData.kind,
    });

    if (existingTraining) {
       messages.error = 'Повторний запис на тренування';
    }

    const user = await User.findById(userData.userID);
    const getIDSeasonTicket = user.seasonTickets[user.seasonTickets.length - 1]._id;
    // const getIDSeasonTicket = user.seasonTickets.find(item => item._id.toString() === seasonTicketID.toString());
    const getRemainderOfTrainings = getIDSeasonTicket.remainderOfTrainings;

    // const getRemainderOfTrainings = user.seasonTickets[user.seasonTickets.length - 1].remainderOfTrainings;
    
    if (getRemainderOfTrainings === 0) {
        messages.error = 'Кількість тренувань по абонементу закінчилася. Ви записані як на разове заняття';
    }

    const updatedUserTrainings = await User.findByIdAndUpdate(
        { _id: userData.userID },
        {
            $push: {
                trainings: {
                    seasonTicketsID: getRemainderOfTrainings === 0 ? 'without seasonTickets' : getIDSeasonTicket,
                    day: userData.day,
                    time: userData.time,
                    kind_trainee: userData.kind_trainee,
                    date: userData.date,
                    coach: userData.name_Coach,
                    kind: userData.kind,
                    visitTrainee: false,
                    canceledTraining: false,
                    isTrainingReminderSent: false,
                }
            }
        },
        { new: true }
    );
    const newInfoUser = updatedUserTrainings.trainings[updatedUserTrainings.trainings.length - 1];
    await User.updateOne(
        { 'seasonTickets._id': getIDSeasonTicket },
        { 
            $push: {
                'seasonTickets.$.infoTrainings':
                    { 
                        day: newInfoUser.day,
                        idTraining: getRemainderOfTrainings === 0 ? 'without seasonTickets' : newInfoUser._id,
                        time: newInfoUser.time,
                        kind_trainee: newInfoUser.kind_trainee,
                        date: newInfoUser.date,
                        coach: newInfoUser.coach,
                        kind: newInfoUser.kind,
                        visitTrainee: newInfoUser.visitTrainee,
                        canceledTraining: newInfoUser.canceledTraining,
                        isTrainingReminderSent: newInfoUser.isTrainingReminderSent,
                    }
            }
        }
    );

    return { newInfoUser, messages };
};

const getTrainingsCoachFunction = async (userData) => {
    const name_Coach = userData.coachLabel;
    const getUsers = await User.find({ 'trainings': { $elemMatch: { coach: name_Coach } } });
    
    const filteredUsers = getUsers.map(user => {
        const filteredTrainings = user.trainings.filter(training => training.coach === name_Coach);
        return {
            name: user.name,
            surname: user.surname,
            _id: user._id,
            instagram: user.instagram,
            seasonTickets: user.seasonTickets._id,
            trainings: filteredTrainings,
        };
    });

    // console.log(filteredUsers);
    return filteredUsers;
};

const visitTrainingFunction = async (trainingInfo) => {
    const trainingID = trainingInfo.trainingID;
    const visit = trainingInfo.visit;
    const seasonTicketID = trainingInfo.seasonTicketID;
    let message = {};

    const user = await User.findOne({ 'seasonTickets._id': seasonTicketID });
    const getSeasonTicket = user.seasonTickets.find(item => item._id.toString() === seasonTicketID.toString());
    const getRemainderOfTrainings = getSeasonTicket.remainderOfTrainings;
    const getUserTraining = getSeasonTicket.infoTrainings.find(item => item.idTraining.toString() === trainingID.toString());
    const getVisitTrainee = getUserTraining.visitTrainee;
    const getCanceledTraining = getUserTraining.canceledTraining;

    if (getVisitTrainee === false && getCanceledTraining === true) {
        return message.error = "Повторна відмітка заборонена! Зверніть до адміністрації.";
    }

    if (visit === 'true') {
        const promises = [
            User.updateOne(
                { 'trainings._id': trainingID },
                { $set: { 'trainings.$.visitTrainee': true } }
            ),
            User.updateOne(
                { 'seasonTickets.infoTrainings.idTraining': trainingID },
                { $set: { 'seasonTickets.$[elem].infoTrainings.$[innerElem].visitTrainee': true } },
                { arrayFilters: [{ 'elem.infoTrainings.idTraining': trainingID }, { 'innerElem.idTraining': trainingID }] }
            ),
            User.updateOne(
                { 'seasonTickets.infoTrainings.idTraining': trainingID },
                { $set: { 'seasonTickets.$[elem].infoTrainings.$[innerElem].canceledTraining': false } },
                { arrayFilters: [{ 'elem.infoTrainings.idTraining': trainingID }, { 'innerElem.idTraining': trainingID }] }
            ),
            User.updateOne(
                { 'trainings._id': trainingID },
                { $set: { 'trainings.$.canceledTraining': false } }
            )
        ];

        await Promise.all(promises);
        return message.error = 'Підтверджено тренування';
    }

    if (visit === 'false') {

        const promises = [
            User.updateOne(
                { 'trainings._id': trainingID },
                { $set: { 'trainings.$.visitTrainee': false } }
            ),
            User.updateOne(
                { 'seasonTickets.infoTrainings.idTraining': trainingID },
                { $set: { 'seasonTickets.$[elem].infoTrainings.$[innerElem].visitTrainee': false } },
                { arrayFilters: [{ 'elem.infoTrainings.idTraining': trainingID }, { 'innerElem.idTraining': trainingID }] }
            ),
            User.updateOne(
                { 'seasonTickets.infoTrainings.idTraining': trainingID },
                { $set: { 'seasonTickets.$[elem].infoTrainings.$[innerElem].canceledTraining': true } },
                { arrayFilters: [{ 'elem.infoTrainings.idTraining': trainingID }, { 'innerElem.idTraining': trainingID }] }
            ),
            User.updateOne(
                { 'trainings._id': trainingID },
                { $set: { 'trainings.$.canceledTraining': true } }
            ),
            User.updateOne(
            { 'seasonTickets._id': seasonTicketID },
            {
                $set: {
                    'seasonTickets.$.remainderOfTrainings':
                        getRemainderOfTrainings === 0 ? 0 : getRemainderOfTrainings + 1
                }
            })
        ];

        await Promise.all(promises);
            
        return message.error = 'Скасовано';
    }
    return getUserTraining;
};

// salaryCoachFunction

const salaryCoachFunction = async (coachInfo) => {
    const labelAuth = coachInfo.coach.labelAuth;
    const startDate = new Date(coachInfo.date.startDate);
    const endDate = new Date(coachInfo.date.endDate);

    const getUsers = await User.find({
        'trainings': {
            $elemMatch: {
                coach: labelAuth,
                date: {
                    $gte: startDate.toISOString(),
                    $lte: endDate.toISOString()
                }
            }
        }
    });

    const filteredTrainings = [];

    getUsers.forEach(user => {
        user.trainings.forEach(training => {
            const trainingDate = new Date(training.date);
            if (training.coach === labelAuth && trainingDate >= startDate && trainingDate <= endDate) {
                filteredTrainings.push({
                    ...training.toObject(),
                    user: {
                        _id: user._id,
                        name: user.name,
                        surname: user.surname,
                        instagram: user.instagram,
                        birthday: user.birthday,
                        tel: user.tel,
                        trainingVisit: training.visitTrainee,
                        trainingCanceled: training.canceledTraining,
                        isTrainingReminderSent: training.isTrainingReminderSent,
                        trainingSeasonTicketsID: training.seasonTicketsID,
                        trainingId: training._id,
                    }
                });
            }
        });
    });

    // Групування тренувань за унікальними датами та часом
    const groupedTrainings = {};
    filteredTrainings.forEach(training => {
        const { date, time } = training;
        const dateTimeKey = `${date.toISOString().slice(0, 10)}_${time}`;
        if (!groupedTrainings[dateTimeKey]) {
            groupedTrainings[dateTimeKey] = { training, users: [] };
        }
        groupedTrainings[dateTimeKey].users.push(training.user);
    });

    // Виведення результату
    // console.log(groupedTrainings);

    return groupedTrainings;
};













// const visitTrainingFunction = async (trainingInfo) => {
//     try {
//         const trainingID = trainingInfo.trainingID;
//         const visit = trainingInfo.visit;
//         const seasonTicketID = trainingInfo.seasonTicketID;

//         console.log('trainingID:', trainingID);
//         console.log('visit:', visit);
//         console.log('seasonTicketID:', seasonTicketID);

//         const updatedTrainings = await User.updateOne(
//             { 'trainings._id': trainingID },
//             { $set: { 'trainings.$.visitTrainee': visit } }
//         );

//         const updatedSeasonTickets = await User.updateOne(
//             { 'seasonTickets.infoTrainings.idTraining': trainingID },
//             { $set: { 'seasonTickets.$[elem].infoTrainings.$[innerElem].visitTrainee': visit } },
//             { arrayFilters: [{ 'elem.infoTrainings.idTraining': trainingID }, { 'innerElem.idTraining': trainingID }] }
//         );

//         if (!updatedTrainings) {
//             console.error("Failed to update trainings.");
//         } else {
//             console.log("Trainings updated successfully.");
//         }

//         if (!updatedSeasonTickets) {
//             console.error("Failed to update season tickets.");
//         } else {
//             console.log("Season tickets updated successfully.");
//         }

//         const trainingExists = await User.findOne({ 'trainings._id': trainingID });
//         const seasonTicketExists = await User.findOne({ 'seasonTickets._id': seasonTicketID });

//         if (!trainingExists) {
//             console.error("Training not found.");
//         }

//         if (!seasonTicketExists) {
//             console.error("Season ticket not found.");
//         }

//         if (!visit) {
//             const user = await User.findOne({ 'seasonTickets._id': seasonTicketID });
//             const getSeasonTicket = user.seasonTickets.find(item => item._id.toString() === seasonTicketID.toString());
//             const getRemainderOfTrainings = getSeasonTicket.remainderOfTrainings;

//             await User.updateOne(
//                 { 'seasonTickets._id': seasonTicketID },
//                 { 
//                     $set: {
//                         'seasonTickets.$.remainderOfTrainings':
//                             getRemainderOfTrainings === 0 ? 0 : getRemainderOfTrainings + 1
//                     }
//                 }
//             );
//         }

//         return trainingID;
//     } catch (error) {
//         console.error("Error:", error);
//         throw error;
//     }
// };












// const buySeasonTicket = async (userData, res) => {
//   const find = await User.findOne({ _id: userData.user.id });
//     if (find) {
//       const updateObject = {
//         id: userData.seasonTicket._id,
//         name: userData.seasonTicket.name,
//         limitOfTrainings: userData.seasonTicket.limit,
//         remainderOfTrainings: userData.seasonTicket.limit,
//         price: userData.seasonTicket.price,
//         kind: userData.seasonTicket.kind,
//         includes: userData.seasonTicket.includes,
//         dateChoose: userData.dateChoose,
//         };
//         return await User.findOneAndUpdate(
//             {_id: userData.user.id},
//             { $set: { seasonTickets: updateObject } },
//             {new: true}
//         );
//     }
//     return;
// }


// const changePassword = async (userData, res) => {
//     const { id } = userData;
//     const keys = Object.keys(userData);
//     const values = Object.values(userData);
//     const fieldKey = keys[1];
//     const fieldName = values[1];

//     const find = await User.findOne({_id: id});

//     if (find) {
//         const updateObject = {};
//         updateObject[fieldKey] = fieldName;

//         return await User.findOneAndUpdate(
//             {_id: id},
//             {$set: updateObject},
//             {new: true}
//         );
//     }
//     return;
// }


const logoutUser = async (id) => {
    await User.findByIdAndUpdate(id, {token: null})
}

// // const addData = async (req, res) => {
// //     // eslint-disable-next-line camelcase
// //     const { id, info } = req;
// //     const { name, instaNickName } = info;
// //     // console.log(info)
// //     const find = await TgBotUser.findOne({ id });
// //     if (find) {
// //         await TgBotUser.findOneAndUpdate(
// //             { id },
// //            { name: name, instaNickName: instaNickName, updateUser: true }
// //        )
// //        return await TgBotUser.findOneAndUpdate(
// //             { id },
// //             { $push: { info: info } }
// //         )}
// //     const newTGUser = new TgBotUser({ id, name: name, instaNickName: instaNickName, updateUser: true, info });
// //     return await newTGUser.save()
// // }

// const addData = async (req, res) => {
//     // eslint-disable-next-line camelcase
//     const { id, info } = req;
//     const { day, time, name, instaNickName, date } = info;
//     // const dateString = 'Mon Apr 24 2023 10:56:25 GMT+0300 (Восточная Европа, летнее время)';
//     const newDate = new Date(date);
//     const year = newDate.getFullYear();
//     const month = ('0' + (newDate.getMonth() + 1)).slice(-2);
//     const newDay = ('0' + newDate.getDate()).slice(-2);
//     const formattedDate = `${year}-${month}-${newDay}`;
//     // console.log(formattedDate); // 2023-04-24
//     // console.log(date)
//     const find = await TgBotUser.findOne({ id });
//     // console.log(find)
//     if (find) {
//         const isDuplicateInfo = find.info.filter(infoItem =>
//             infoItem.day === day && infoItem.time === time && infoItem.kind_trainee === info.kind_trainee && infoItem.date.toISOString().slice(0, 10) === formattedDate
//         );
//         if (isDuplicateInfo.length > 0) {
//             console.log(isDuplicateInfo);
//             return { message: "User already has this info" };
//         }
//         if (find.updateUser === false) {
//             await TgBotUser.findOneAndUpdate(
//                 { id },
//                 { name: name, instaNickName: instaNickName, updateUser: true }
//             )
//         }
//         return await TgBotUser.findOneAndUpdate(
//             { id },
//             { $push: { info: info } }
//         );
//     }
//     const newTGUser = new TgBotUser({ id, name: name, instaNickName: instaNickName, updateUser: true, info });
//     return await newTGUser.save();
// };

// const upgradeUsers = async (req, res) => {
//     // eslint-disable-next-line camelcase
//     const { id, info } = req;
//     const { name, instaNickName } = info;
//     const find = await TgBotUser.findOne({ id });
//     if (find) {
//        return await TgBotUser.findOneAndUpdate(
//             { id },
//            { name: name, instaNickName: instaNickName, updateUser: true }
//        )}
//     const newTGUser = new TgBotUser({ id, name: name, instaNickName: instaNickName, updateUser: true, info });
//     return await newTGUser.save()
// }

// const canceledTraining = async (req, res) => {
//     const { id, status } = req;
//     // console.log(req)
//         await TgBotUser.updateOne({ 'info._id': id._id }, { '$set': { 'info.$.canceledTraining': true } });
//         await TgBotUser.updateOne({ 'info._id': id._id }, { '$set': { 'info.$.visitTrainee': status.status } });
//     //    console.log(await TgBotUser.updateOne({ 'info._id': id._id }, { '$set': { 'info.$.visitTrainee': status.status } }));
//     const done = await TgBotUser.findOneAndUpdate({ 'info._id': id._id }, (err, doc) => {
//         if (err) { console.log(err); }
//         return doc;
//     });
//     // console.log(status)
//     // console.log(done)
//     return done;
//     };

//     const changeSeasonTicketVisit = async (req, res) => {
//         const { _id } = req;
//         const done = await TgBotUser.findOneAndUpdate({ 'info._id': _id }, (err, doc) => {
//             if (err) { console.log(err); }
//             return doc;
//         });
//         if(done.seasonTickets.length > 0){
//             const getIDSeasonTicket = done.seasonTickets[done.seasonTickets.length - 1]._id;
//             const getRemainderOfSeasonTicket = done.seasonTickets[done.seasonTickets.length - 1].remainderOfTrainnings - 1;
//             await TgBotUser.updateOne({ 'info._id': _id }, { '$set': { 'info.$.visitTrainee': true }});
//             await TgBotUser.updateOne({ 'info._id': _id }, { '$set': { 'info.$.canceledTraining': false } })
//             await TgBotUser.updateOne({ 'seasonTickets._id': getIDSeasonTicket }, { '$set': { 'seasonTickets.$.remainderOfTrainnings': getRemainderOfSeasonTicket }})
//             return done;
//         }
//         await TgBotUser.updateOne({ 'info._id': _id }, { '$set': { 'info.$.visitTrainee': true }});
//         await TgBotUser.updateOne({ 'info._id': _id }, { '$set': { 'info.$.canceledTraining': false } })
//         return done;
//     };
    
// const addInfoTrainingsSeasonTickets = async (req, res) => {
//     const find = await TgBotUser.findOneAndUpdate({ 'info._id': req.idTraining }, (err, doc) => {
//         if (err) { console.log(err); }
//         return doc;
//     });
//     if (find.seasonTickets.length > 0) {
//         const getIDSeasonTicket = find.seasonTickets[find.seasonTickets.length - 1]._id;
//         if (find.seasonTickets[find.seasonTickets.length - 1].infoTrainings.find(arr => arr.idTraining === req.idTraining)) {
//             return null;
//         }
//         // const getIDTraining = find.seasonTickets[find.seasonTickets.length - 1].infoTrainings.find(arr => arr.idTraining === req.idTraining);
//         await TgBotUser.updateOne({ 'seasonTickets._id': getIDSeasonTicket },
//             { '$push': { 'seasonTickets.$.infoTrainings': req } })
//         return find;
//     };
//     return find;
// };


//     const addSeasonTickets = async (req, res) => {
//         const { _id, seasonTickets } = req;
//         const find = await TgBotUser.findById( _id );
//         if (find) {
//            return await TgBotUser.findOneAndUpdate(
//             { _id },
//             { $push: { seasonTickets: seasonTickets } },
//         );
//         }
//         const newTGUser = new TgBotUser({_id, seasonTickets});
//         return await newTGUser.save();
//     };

//     const findTGUserByID = async (req, res) => {
//         const findUser = await TgBotUser.findOne(req)
//         return findUser;
//         };

module.exports = {
    test,
    listData,
    listCoaches,
    registrationUser,
    loginUser,
    logoutUser,
    upgradeUserPassword,
    signUpTrainingFunction,
    getTrainingsCoachFunction,
    visitTrainingFunction,
    salaryCoachFunction,
    // addData,
    // canceledTraining,
    // addSeasonTickets,
    // changeSeasonTicketVisit,
    // addInfoTrainingsSeasonTickets,
    // findTGUserByID,
    upgradeUsers
}
