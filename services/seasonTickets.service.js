const {SeasonTickets} = require('../models/seasonTickets');
const { User } = require('../models/user');


const listData = async () => {
  const result = await SeasonTickets.find({});
  // console.log(result)
  return result;
};

const buySeasonTicket = async (userData, res) => {
  const find = await User.findOne({ _id: userData.user.id });
    if (find) {
      const updateObject = {
        id: userData.seasonTicket._id,
        name: userData.seasonTicket.name,
        limitOfTrainings: userData.seasonTicket.limit,
        remainderOfTrainings: userData.seasonTicket.limit,
        price: userData.seasonTicket.price,
        kind: userData.seasonTicket.kind,
        includes: userData.seasonTicket.includes,
        dateChoose: userData.dateChoose,
        };
        return await User.findOneAndUpdate(
            {_id: userData.user.id},
            { $push: { seasonTickets: updateObject } },
            {new: true}
        );
    }
    return;
}
// buySeasonTicket

// const registrationUser = async (userData) => {
//     const result = await User.findOne({ tel: userData.tel });
//     if(result) {
//         throw createError(409, 'Telephone in use');
//     }
//     const password = userData.password;
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user =
//         await User.create({
//             ...userData,
//             password: hashedPassword,
//         });

//     return user;
// }

// const loginUser = async ({ tel, password }) => {
//     const user = await User.findOne({ tel });
//     if(!user) {
//         throw createError(401, 'Login or password is wrong');
//     }
//     const isValid = await bcrypt.compare(password, user.password);
//     if(!isValid) {
//         throw createError(401, 'Login or password is wrong');
//     }
//     const payload = {
//         id: user._id,
//     };
//     const token = jwt.sign(payload, SECRET_KEY, {expiresIn: '1h'});
//     await User.findByIdAndUpdate(user._id, {token})
//     return user;
// }

// const upgradeUsers = async (userData, res) => {
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

// const upgradeUserPassword = async (userData, res) => {
//     const { id, currentPassword, newPassword } = userData;
//     const user = await User.findOne({ _id: id });

//     if (user) {
//         const hashedPassword = user.password;
//         const passwordsMatch = await bcrypt.compare(currentPassword, hashedPassword);
//         console.log(passwordsMatch)

//         if (passwordsMatch) {
//             const newPasswordsMatch = await bcrypt.compare(newPassword, hashedPassword);
//             console.log(newPasswordsMatch)
//             if (newPasswordsMatch !== true) {
//                 const hashedNewPassword = await bcrypt.hash(newPassword, 10);
//                 const updatedUser = await User.findOneAndUpdate(
//                     { _id: id },
//                     { $set: { password: hashedNewPassword } },
//                     { new: true }
//                 );

//                 // Ви можете додати додаткові дії або повідомлення, якщо необхідно
//                 return updatedUser;
//             } else {
//                 return { error: 'Новий пароль співпадає з поточним паролем' };
//             }
//         } else {
//             return { error: 'Поточний пароль невірний' };
//         }
//     } else {
//         return { error: 'Користувача не знайдено' };
//     }
// };


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


// const logoutUser = async (id) => {
//     await User.findByIdAndUpdate(id, {token: null})
// }

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
    // test,
  listData,
  buySeasonTicket,
    // registrationUser,
    // loginUser,
    // logoutUser,
    // upgradeUserPassword,
    // addData,
    // canceledTraining,
    // addSeasonTickets,
    // changeSeasonTicketVisit,
    // addInfoTrainingsSeasonTickets,
    // findTGUserByID,
    // upgradeUsers
}
