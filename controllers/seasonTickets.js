// const dataUser = require("../services/user.service");
const seasonTickets = require("../services/seasonTickets.service");

// const performTest = async (req, res, next) => {
//     try {
//         const result = await dataUser.test();  // Викликати іншу функцію, не ту, яку оголошено вище
//         return res.send(result);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Internal Server Error');
//     }
// }

const listOfSeasonTickets = async (req, res, next) => {
    try {
      const result = await seasonTickets.listData();  // Викликати іншу функцію, не ту, яку оголошено вище
      // console.log("GOOD")
        return res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

const buySeasonTicket = async (req, res, next) => {
    try {
      const result = await seasonTickets.buySeasonTicket(req.body);
      // console.log("GOOD")
        return res.status(200).send(result.seasonTickets);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

// buySeasonTicket
// const registrationUser = async (req, res, next) => {
//     try {
//         const user = await dataUser.registrationUser(req.body);
//         res.status(201).json({
//             code: 201,
//             data: user
//         });
//     } catch (e) {
//         next(e);
//     }
// }

// const loginUser = async (req, res, next) => {
//     try {
//         const user = await dataUser.loginUser(req.body);
//         res.json(user);
//     } catch (e) {
//         next(e);
//         return e;
//     }
// }

// const upgradeUsers = async (req, res, next) => {
//     console.log("req.body: ", req.body)
//     try {
//         const data = await dataUser.upgradeUsers(req.body);
//         return res.status(200).json(data);
//     } catch (e) {
//         if (e.message.includes('duplicate')) {
//             e.status = 400
//         }
//         next(e);
//     }
// };

// const upgradeUserPassword = async (req, res, next) => {
//     // console.log("req.body: ", req.body)
//     try {
//         const data = await dataUser.upgradeUserPassword(req.body);
//         return res.status(200).json(data);
//     } catch (e) {
//         if (e.message.includes('duplicate')) {
//             e.status = 400
//         }
//         next(e);
//     }
// };



// // =============================================================================================================================================
// const logoutUser = async (req, res, next) => {
//     // console.log("==============================================================================================================================")
//     // console.log("req: ", req)
//     try {
//         await dataUser.logoutUser(req.user._id);
//         res.sendStatus(204);
//     } catch (e) {
//         next(e);
//     }
// }
// const listDataUsers = async (req, res, next) => {
//     try {
//         const all = await dataUser.listData();
//         res.json(all);
//     } catch (e) {
//         next(e);
//     }
// }

// const addDataUsers = async (req, res, next) => {
//     // console.log("req.body: ", req.body)
//     try {
//         const data = await dataUser.addData(req.body);
//         return res.status(201).json(data);
//     } catch (e) {
//         if (e.message.includes('duplicate')) {
//             e.status = 400
//         }
//         next(e);
//     }
// };

// const upgradeUsers = async (req, res, next) => {
//     // console.log("req.body: ", req.body)
//     try {
//         const data = await dataUser.upgradeUsers(req.body);
//         return res.status(201).json(data);
//     } catch (e) {
//         if (e.message.includes('duplicate')) {
//             e.status = 400
//         }
//         next(e);
//     }
// };



// const canceledTraining = async (req, res, next) => {
//     // console.log("DDD")
//     try {
//         const data = await dataUser.canceledTraining(req.body);
//         // console.log(res.json(res1).status(201));
//         return res.status(201).json(data);
//     } catch (e) {
//         if(e.message.includes('duplicate')){
//             e.status = 400
//         }
//         next(e);
//     }
// };

// const changeVisitTrainingOfSeasonTickets = async (req, res, next) => {
//     try {
//         const data = await dataUser.changeSeasonTicketVisit(req.body);
//         if (data) {
//             return res.status(201).json(data);
//         }
//         return res.status(201).json(data);
//     } catch (e) {
//         if(e.message.includes('duplicate')){
//             e.status = 400
//         }
//         next(e);
//     }
// };

// const addInfoTrainingsSeasonTickets = async (req, res, next) => {
//     try {
//         const data = await dataUser.addInfoTrainingsSeasonTickets(req.body);
//         if (data) {
//             return res.status(201).json(data);
//         }
//         return res.status(201).json(data);
//     } catch (e) {
//         if(e.message.includes('duplicate')){
//             e.status = 400
//         }
//         next(e);
//     }
// };

// const findTGUserByID = async (req, res, next) => {
//     // console.log("req.body: ", req.body)
//     try {
//         const data = await dataUser.findTGUserByID(req.body);
//         // console.log(req.body)
//         return res.json(data);
//     } catch (e) {
//         if(e.message.includes('duplicate')){
//             e.status = 400
//         }
//         next(e);
//     }
// };

// const addSeasonTickets = async (req, res, next) => {
//     try {
//         const data = await dataUser.addSeasonTickets(req.body);
//         return res.status(201).json(data);
//     } catch (e) {
//         if(e.message.includes('duplicate')){
//             e.status = 400
//         }
//         next(e);
//     }
// }



module.exports = {
    // listDataUsers,
    // addDataUsers,
    // canceledTraining,
    // addSeasonTickets,
    // findTGUserByID,
    // changeVisitTrainingOfSeasonTickets,
    // addInfoTrainingsSeasonTickets,
    // upgradeUsers,
    // upgradeUserPassword,
    // performTest,
    // listOfUsers,
    // registrationUser,
    // loginUser,
    listOfSeasonTickets,
    buySeasonTicket
}
