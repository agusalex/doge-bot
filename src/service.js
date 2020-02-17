const messages = require('./messages');
const repository = require('./repository')

module.exports = function commands(robot) {
    return { addDoge, getDoges, getHelp, getHistory }

    async function addDoge(res) {
        const { room, user } = res.message;
        const { id: userId, name } = user;
        await repository.addDoge({ userId, room, userName: name });
        const roomUser = await repository.getRoomUser({ room, userId })
        const { doge_count: dogeCount } = roomUser
        const message = messages.getDogeMessage({ dogeCount, userId, })

        robot.messageRoom(room, message)
    }

    async function getDoges(res) {
        const { room } = res.message;
        const roomUsers = await repository.getRoomUsersForRoom({ room })
        const message = messages.getDogeListMessage({ roomUsers })

        robot.messageRoom(room, message)
    }

    async function getHelp(res) {
        const { room } = res.message
        const message = messages.helpMessage();
        robot.messageRoom(room, message)
    }

    async function getHistory(res) {
        const { room } = res.message
        const roomUsers = await repository.getRoomHistory({ room })
        const message = messages.getDogeListMessage({ roomUsers })

        robot.messageRoom(room, message)
    }

    // async function scan(res) {
    // const { room } = res.message
    // await repository.
    // }
}