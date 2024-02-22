const { User } = require('../models/user');
// const { arsFitStudioDataBase, client } = require('./mongoDB/mongoDB');
const bcrypt = require('bcryptjs');
const {createError} = require('../helpers/errors');
const {SECRET_KEY} = require("../helpers/env");
const jwt = require('jsonwebtoken');

const test = async () => {
    const testik = 'working'
    return testik;
}

const listData = async () => {
    const client = 'client';
    const users = await User.find({ access: client }).select('_id name surname tel instagram birthday');
        // console.log(users)
        return users;
};

const listCoaches = async () => {
    const admin = 'admin';
    const coach = 'coach';
    const coaches = await User.find({ access: coach }).select('_id name surname labelAuth tel instagram comments');
    const admins = await User.find({ access: admin }).select('_id name surname labelAuth tel instagram comments');

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
    if (!user) {
        throw createError(401, 'Login or password is wrong');
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        throw createError(401, 'Login or password is wrong');
    }
    const payload = {
        id: user._id,
    };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
    await User.findByIdAndUpdate(user._id, { token });

    const updatedUser = await User.findOne({ tel });
    return updatedUser;
};

const authUserFunction = async (token) => {
    const user = await User.findOne({ token: token.token });

    // Перевіряємо, чи токен не протермінований
    if (!user || Date.now() >= token.expiresIn) {
        throw createError(401, 'Unauthorized');
    }

    return user;
};

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
    const newUserDate = new Date(userData.date);
    const user = await User.findById(userData.userID);

    const existingTraining = user.trainings.find(item => item.day === userData.day
        && item.time === userData.time && item.kind === userData.kind
        && item.date.toISOString().slice(0, 10) === newUserDate.toISOString().slice(0, 10));

    if (existingTraining) {
        messages.error = 'Повторний запис на тренування';
        return { newInfoUser: null, messages };
    }

    let getIDSeasonTicket;
    let getRemainderOfTrainings;

    if (user.seasonTickets && user.seasonTickets.length > 0) {
        getIDSeasonTicket = user.seasonTickets[user.seasonTickets.length - 1]._id;
        getRemainderOfTrainings = user.seasonTickets[user.seasonTickets.length - 1].remainderOfTrainings;
        
        if (getRemainderOfTrainings === 0) {
            messages.warning = 'Кількість тренувань по абонементу закінчилася. Ви записані як на разове заняття';
        }
    } else {
        messages.warning = 'Ви не маєте абонементу. Запис на тренування без абонементу';
    }

    const updatedUserTrainings = await User.findByIdAndUpdate(
        { _id: userData.userID },
        {
            $push: {
                trainings: {
                    seasonTicketsID: user.seasonTickets ? (getRemainderOfTrainings === 0 ? 'without seasonTickets' : getIDSeasonTicket) : 'without seasonTickets',
                    day: userData.day,
                    time: userData.time,
                    kind_training: userData.kind_training,
                    date: userData.date,
                    coach: userData.name_Coach,
                    kind: userData.kind,
                    visitTraining: false,
                    canceledTraining: false,
                    isTrainingReminderSent: false,
                }
            }
        },
        { new: true }
    );

    const newInfoUser = updatedUserTrainings.trainings[updatedUserTrainings.trainings.length - 1];
    
    const newTrainingInfo = {
        idTraining: newInfoUser._id,
        day: newInfoUser.day,
        time: newInfoUser.time,
        kind_training: newInfoUser.kind_training,
        date: newInfoUser.date,
        coach: newInfoUser.coach,
        kind: newInfoUser.kind,
        visitTraining: newInfoUser.visitTraining,
        canceledTraining: newInfoUser.canceledTraining,
        isTrainingReminderSent: newInfoUser.isTrainingReminderSent
    };

    if (user.seasonTickets && user.seasonTickets.length > 0) {
        await User.updateOne(
            { 'seasonTickets._id': getIDSeasonTicket },
            {
                $push: {
                    'seasonTickets.$.infoTrainings': newTrainingInfo
                },
                $set: {
                    'seasonTickets.$.remainderOfTrainings': getRemainderOfTrainings === 0 ? 0 : getRemainderOfTrainings - 1
                }
            }
        );
    }

    return { newInfoUser, messages };
};

const getTrainingsCoachFunction = async (userData) => {
    // console.log(userData);
    const name_Coach = userData.coachLabel;
    const date = userData.date.slice(0, 10);
    const getUsers = await User.find({ 'trainings': { $elemMatch: { coach: name_Coach } } });
    // console.log(getUsers)
    const filteredUsers = getUsers.map(user => {
        const filteredTrainings = user.trainings.filter(training => training.coach === name_Coach && training.date.toISOString().slice(0, 10) >= date);
        // const user = User.findOne({ 'labelAuth': name_Coach });
        // console.log(user);
        const getNewArray = filteredTrainings.map(training => {
            return {
                name: user.name,
                surname: user.surname,
                idUser: user._id,
                instagram: user.instagram,
                seasonTicketID: training.seasonTicketsID,
                day: training.day,
                time: training.time,
                kind_training: training.kind_training,
                date: training.date,
                coach: training.coach,
                kind: training.kind,
                visitTraining: training.visitTraining,
                canceledTraining: training.canceledTraining,
                isTrainingReminderSent: training.isTrainingReminderSent,
                idTraining: training._id,
            }
        })
        return getNewArray;
    });

    // console.log("filteredUsers: ", filteredUsers);
    return filteredUsers;
};

const visitTrainingFunction = async (trainingInfo) => {
    const seasonTicketID = trainingInfo.seasonTicketID; // one-time-class ID  without seasonTickets
    const trainingID = trainingInfo.trainingID;
    const visit = trainingInfo.visit;
    let message = {};
    const user = await User.findOne({ 'trainings._id': trainingID });

    const getCanceledTraining = user.trainings.find(item => item._id.toString() === trainingID).canceledTraining;

    if (getCanceledTraining === true) {
        message.error = 'Повторна відмітка заборонена. Зверніться до адміністрації'
        return {message};
    }
    if (seasonTicketID === 'one-time-class' && visit === true) {
        const markTraining = await User.updateOne(
            { 'trainings._id': trainingID },
            { $set: { 'trainings.$.visitTraining': visit, 'trainings.$.canceledTraining': !visit } }
        );
        message.error = 'Підтверджено тренування';
        return { markTraining, message };
    }
    if (seasonTicketID === 'one-time-class' && visit === false) {
        const markTraining = await User.updateOne(
            { 'trainings._id': trainingID },
            { $set: { 'trainings.$.visitTraining': visit, 'trainings.$.canceledTraining': !visit } }
        )
        message.error = 'Скасовано тренування';
        
        return { markTraining, message };
    }
    if (seasonTicketID === 'without seasonTickets' && visit === true) {
        const user = await User.findOne({ 'trainings._id': trainingID });
        const seasonTickets = user.seasonTickets.filter(training =>
            training.infoTrainings.some(item => item.idTraining === trainingID)
        );
        const seasonTicketsIds = seasonTickets.map(ticket => ticket._id);
        const markTraining = await User.updateOne(
            { 'trainings._id': trainingID },
            { $set: { 'trainings.$.visitTraining': visit, 'trainings.$.canceledTraining': !visit } }
        );
        const markSeasonTickets = await User.updateOne(
            { 'seasonTickets._id': seasonTicketsIds },
            { $set: { 'seasonTickets.$[elem].infoTrainings.$[innerElem].visitTraining': visit, 'seasonTickets.$[elem].infoTrainings.$[innerElem].canceledTraining': !visit } },
            { arrayFilters: [{ 'elem._id': seasonTicketsIds }, { 'innerElem.idTraining': trainingID }] }
        )
        message.error = 'Підтверджено тренування';
        
        return { markTraining, markSeasonTickets, message };
    }
    if (seasonTicketID === 'without seasonTickets' && visit === false) {
        const user = await User.findOne({ 'trainings._id': trainingID });
        const seasonTickets = user.seasonTickets.filter(training =>
            training.infoTrainings.some(item => item.idTraining === trainingID)
        );
        const seasonTicketsIds = seasonTickets.map(ticket => ticket._id);

        const markTraining = await User.updateOne(
            { 'trainings._id': trainingID },
            { $set: { 'trainings.$.visitTraining': visit, 'trainings.$.canceledTraining': !visit } }
        );
        const markSeasonTickets = await User.updateOne(
            { 'seasonTickets._id': seasonTicketsIds },
            { $set: { 'seasonTickets.$[elem].infoTrainings.$[innerElem].visitTraining': visit, 'seasonTickets.$[elem].infoTrainings.$[innerElem].canceledTraining': !visit } },
            { arrayFilters: [{ 'elem._id': seasonTicketsIds }, { 'innerElem.idTraining': trainingID }] }
        );
        const addRemainderOfTrainings = await User.updateOne(
            { 'seasonTickets._id': seasonTicketsIds },
            { $inc: { 'seasonTickets.$.remainderOfTrainings': 1 } }
        )
        message.error = 'Скасовано тренування';
        
        return { markTraining, markSeasonTickets, addRemainderOfTrainings, message };
    }
    if (seasonTicketID !== 'without seasonTickets' && seasonTicketID !== 'one-time-class' && visit === true) {
        const markTraining = await User.updateOne(
            { 'trainings._id': trainingID },
            { $set: { 'trainings.$.visitTraining': visit, 'trainings.$.canceledTraining': !visit } }
        );
        const markSeasonTickets = await User.updateOne(
            { 'seasonTickets._id': seasonTicketID },
            { $set: { 'seasonTickets.$[elem].infoTrainings.$[innerElem].visitTraining': visit, 'seasonTickets.$[elem].infoTrainings.$[innerElem].canceledTraining': !visit } },
            { arrayFilters: [{ 'elem._id': seasonTicketID }, { 'innerElem.idTraining': trainingID }] }
        )
        message.error = 'Підтверджено тренування';
        
        return { markTraining, markSeasonTickets, message };
    }
    if (seasonTicketID !== 'without seasonTickets' && seasonTicketID !== 'one-time-class' && visit === false) {
        const markTraining = await User.updateOne(
            { 'trainings._id': trainingID },
            { $set: { 'trainings.$.visitTraining': visit, 'trainings.$.canceledTraining': !visit } }
        );
        const markSeasonTickets = await User.updateOne(
            { 'seasonTickets._id': seasonTicketID },
            { $set: { 'seasonTickets.$[elem].infoTrainings.$[innerElem].visitTraining': visit, 'seasonTickets.$[elem].infoTrainings.$[innerElem].canceledTraining': !visit } },
            { arrayFilters: [{ 'elem._id': seasonTicketID }, { 'innerElem.idTraining': trainingID }] }
        );
        const addRemainderOfTrainings = await User.updateOne(
            { 'seasonTickets._id': seasonTicketID },
            { $inc: { 'seasonTickets.$.remainderOfTrainings': 1 } }
        )
        message.error = 'Скасовано тренування';
        
        return { markTraining, markSeasonTickets, addRemainderOfTrainings, message };
    }

    return { message };
};




// const visitTrainingFunction = async (trainingInfo) => {
//     const { trainingID, visit, seasonTicketID } = trainingInfo;

//     let message = {};
    
//     try {
//         // Перевірка наявності значень trainingID, visit та seasonTicketID
//         if (!trainingID || !visit || !seasonTicketID) {
//             throw new Error("Не всі обов'язкові дані надані.");
//         }

//         // Пошук користувача
//         const user = await User.findOne({ 'seasonTickets.infoTrainings.idTraining': trainingID });

//         // Перевірка наявності користувача
//         if (!user) {
//             throw new Error("Користувача з таким trainingID не знайдено.");
//         }

//         let seasonTicketIDToUse = seasonTicketID;

//         // Перевірка наявності seasonTicketID і пошук квитка, якщо він відсутній
//         if (seasonTicketID === 'without seasonTickets') {
//             const getSeasonTicket = user.seasonTickets.find(item => item._id.toString() === seasonTicketID) ? user.seasonTickets.find(item => item._id.toString() === seasonTicketID) : user.seasonTickets[user.seasonTickets.length - 1];
//             seasonTicketIDToUse = getSeasonTicket && getSeasonTicket._id;
//             // console.log(getSeasonTicket)
//         }

//         // Пошук квитка
//         const seasonTicket = user.seasonTickets.find(item => item._id.toString() === seasonTicketIDToUse.toString());
//             console.log(user)
        
//         // Перевірка наявності квитка
//         if (!seasonTicket) {
//             throw new Error("Квиток з таким seasonTicketID не знайдено.");
//         }

//         const getUserTraining = seasonTicket.infoTrainings.find(item => item.idTraining.toString() === trainingID.toString());

//         // Перевірка наявності тренування у квитка
//         if (!getUserTraining) {
//             throw new Error("Тренування з таким trainingID не знайдено в квитку.");
//         }

//         const { visitTraining, canceledTraining } = getUserTraining;

//         // Перевірка на наявність змінних
//         if (typeof visitTraining !== 'boolean' || typeof canceledTraining !== 'boolean') {
//             throw new Error("Неправильний формат даних для відвідування або скасування тренування.");
//         }

//         if (visitTraining === false && canceledTraining === true) {
//             throw new Error("Повторна відмітка заборонена! Зверніться до адміністрації.");
//         }
        
//         const promises = [
//             User.updateOne(
//                 { 'trainings._id': trainingID },
//                 { $set: { 'trainings.$.visitTraining': true, 'trainings.$.canceledTraining': false } }
//             ),
//             User.updateOne(
//                 { 'seasonTickets._id': seasonTicketIDToUse },
//                 { $set: { 'seasonTickets.$[elem].infoTrainings.$[innerElem].visitTraining': true, 'seasonTickets.$[elem].infoTrainings.$[innerElem].canceledTraining': false } },
//                 { arrayFilters: [{ 'elem._id': seasonTicketIDToUse }, { 'innerElem.idTraining': trainingID }] }
//             )
//         ];

//         if (visit === 'false') {
//             promises.push(
//                 User.updateOne(
//                     { 'trainings._id': trainingID },
//                     { $set: { 'trainings.$.visitTraining': false, 'trainings.$.canceledTraining': true } }
//                 ),
//                 User.updateOne(
//                     { 'seasonTickets._id': seasonTicketIDToUse },
//                     { $set: { 'seasonTickets.$[elem].infoTrainings.$[innerElem].visitTraining': false, 'seasonTickets.$[elem].infoTrainings.$[innerElem].canceledTraining': true } },
//                     { arrayFilters: [{ 'elem._id': seasonTicketIDToUse }, { 'innerElem.idTraining': trainingID }] }
//                 ),
//                 User.updateOne(
//                     { 'seasonTickets._id': seasonTicketIDToUse },
//                     { $inc: { 'seasonTickets.$.remainderOfTrainings': 1 } }
//                 )
//             );
//         } else {
//             // Додано оновлення для випадку, коли visit === 'true'
//             promises.push(
//                 User.updateOne(
//                     { 'trainings._id': trainingID },
//                     { $set: { 'trainings.$.visitTraining': true, 'trainings.$.canceledTraining': false } }
//                 ),
//                 User.updateOne(
//                     { 'seasonTickets._id': seasonTicketIDToUse },
//                     { $set: { 'seasonTickets.$[elem].infoTrainings.$[innerElem].visitTraining': true, 'seasonTickets.$[elem].infoTrainings.$[innerElem].canceledTraining': false } },
//                     { arrayFilters: [{ 'elem._id': seasonTicketIDToUse }, { 'innerElem.idTraining': trainingID }] }
//                 )
//             );
//         }

//         await Promise.all(promises);
        
//         message.error = visit === 'true' ? 'Підтверджено тренування' : 'Скасовано тренування';
//         return message;
//     } catch (error) {
//         console.error(error);
//         message.error = 'Повторна відмітка заборонена! Зверніться до адміністрації.';
//         return message;
//     }
// };



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
                        trainingVisit: training.visitTraining,
                        trainingCanceled: training.canceledTraining,
                        isTrainingReminderSent: training.isTrainingReminderSent,
                        trainingSeasonTicketsID: training.seasonTicketsID,
                        trainingId: training._id,
                    }
                });
            }
        });
    });

    const groupedTrainings = {};
    filteredTrainings.forEach(training => {
        const { date, time } = training;
        const dateTimeKey = `${date.toISOString().slice(0, 10)}_${time}`;
        if (!groupedTrainings[dateTimeKey]) {
            groupedTrainings[dateTimeKey] = { training, users: [] };
        }
        groupedTrainings[dateTimeKey].users.push(training.user);
    });
    return groupedTrainings;
};

const seasonTicketsNotConfirmFunction = async () => {
    const client = 'client';

    const users = await User.find({ access: client });

    const filteredTrainings = users.flatMap(user =>
        user.seasonTickets
            .filter(seasonTicket => seasonTicket.confirmation === false)
            .map(seasonTicket => ({
                userName: user.name,
                userSurname: user.surname,
                userTel: user.tel,
                userInstagram: user.instagram,
                idUser: user._id,
                idSeasonTicket: seasonTicket._id,
                dateChoose: seasonTicket.dateChoose,
                confirmation: seasonTicket.confirmation,
                price: seasonTicket.price,
                nameSeasonTicket: seasonTicket.name,
                dateOfBuying: seasonTicket.dateOfBuying,
            }))
    );

    // console.log(filteredTrainings);

    return filteredTrainings;
};

// seasonTicketsConfirmFunction

const seasonTicketsConfirmFunction = async (seasonTicketInfo) => {
    const seasonTicketID = seasonTicketInfo.idSeasonTicket;
    const date = new Date(seasonTicketInfo.selectedDateValue);
    // console.log(date);
    let message = {};

    const ticket = await User.findOne({
        'seasonTickets._id': seasonTicketID,
        'seasonTickets.confirmation': true
    });

    if (ticket) {
        message.error = 'Абонемент вже було підтверджено';
        return message;
    }
        const promises = [
            User.updateOne(
                { 'seasonTickets._id': seasonTicketID },
                { $set: { 'seasonTickets.$[elem].confirmation': true } },
                { arrayFilters: [{ 'elem._id': seasonTicketID }] }
            ),
            User.updateOne(
                { 'seasonTickets._id': seasonTicketID },
                { $set: { 'seasonTickets.$[elem].dateOfBuying': date } },
                { arrayFilters: [{ 'elem._id': seasonTicketID }] }
            ),
        ];

        await Promise.all(promises);
    return message.error = 'Підтверджено оплату абонемента';
};

// coachTrainingsPeriodFunction
const coachTrainingsPeriodFunction = async (coachInfo) => {
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
                        trainingVisit: training.visitTraining,
                        trainingCanceled: training.canceledTraining,
                        isTrainingReminderSent: training.isTrainingReminderSent,
                        trainingSeasonTicketsID: training.seasonTicketsID,
                        trainingId: training._id,
                    }
                });
            }
        });
    });

    const groupedTrainings = {};
    filteredTrainings.forEach(training => {
        const { date, time } = training;
        const dateTimeKey = `${date.toISOString().slice(0, 10)}_${time}`;
        if (!groupedTrainings[dateTimeKey]) {
            groupedTrainings[dateTimeKey] = { training, users: [] };
        }
        groupedTrainings[dateTimeKey].users.push(training.user);
    });
    // console.log(groupedTrainings)
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
//             { $set: { 'trainings.$.visittraining': visit } }
//         );

//         const updatedSeasonTickets = await User.updateOne(
//             { 'seasonTickets.infoTrainings.idTraining': trainingID },
//             { $set: { 'seasonTickets.$[elem].infoTrainings.$[innerElem].visittraining': visit } },
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
//             infoItem.day === day && infoItem.time === time && infoItem.kind_training === info.kind_training && infoItem.date.toISOString().slice(0, 10) === formattedDate
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
//         await TgBotUser.updateOne({ 'info._id': id._id }, { '$set': { 'info.$.visittraining': status.status } });
//     //    console.log(await TgBotUser.updateOne({ 'info._id': id._id }, { '$set': { 'info.$.visittraining': status.status } }));
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
//             await TgBotUser.updateOne({ 'info._id': _id }, { '$set': { 'info.$.visittraining': true }});
//             await TgBotUser.updateOne({ 'info._id': _id }, { '$set': { 'info.$.canceledTraining': false } })
//             await TgBotUser.updateOne({ 'seasonTickets._id': getIDSeasonTicket }, { '$set': { 'seasonTickets.$.remainderOfTrainnings': getRemainderOfSeasonTicket }})
//             return done;
//         }
//         await TgBotUser.updateOne({ 'info._id': _id }, { '$set': { 'info.$.visittraining': true }});
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
    authUserFunction,
    logoutUser,
    upgradeUserPassword,
    signUpTrainingFunction,
    getTrainingsCoachFunction,
    visitTrainingFunction,
    salaryCoachFunction,
    seasonTicketsNotConfirmFunction,
    coachTrainingsPeriodFunction,
    // addData,
    // canceledTraining,
    // addSeasonTickets,
    // changeSeasonTicketVisit,
    // addInfoTrainingsSeasonTickets,
    // findTGUserByID,
    upgradeUsers,
    seasonTicketsConfirmFunction
}
