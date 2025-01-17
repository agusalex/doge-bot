const messages = require('./messages')
const repository = require('./repository')
const stockApi = require('./stockApi')
const stockSentiment = require('./stockSentiment')
const meatApi = require('./meatApi')
const dolar = require('./dolar')

module.exports = function commands(robot, web) {
  const reactions = [
    'doge-cool',
    'doge',
    'doge2',
    'doge3d',
    'doge_gif',
    'doge3',
    'dogecoin',
    'parrot-doge',
    'doge_sunglasses',
    'angry-doge',
    'dogepan',
    'doge12',
    'doge-dance',
  ]

  return {
    addDoge,
    getDoges,
    getHelp,
    getHistory,
    getInfo,
    getCRMStock,
    getDolarBlue,
    getCRMBlue,
    getMeatBlue,
    getMeatPrice,
    getCRMPrediction
  }

  async function addDoge(res) {
    console.log('addDoge...')
    const { room, user, rawText, thread_ts } = res.message

    // If the :doge: is in the middle of the message, ignore
    if (!/^:doge(.*):$/i.test(rawText)) {
      return
    }

    // If message was inside a thread, ignore
    if (thread_ts) {
      return
    }

    const { id: userId, name } = user
    const isGoingTooFast = await checkDogeRate({ userId, room })
    if (isGoingTooFast) {
      const message = messages.getRateMessage()
      sendThreadMessage({ res, message })
    } else {
      await repository.addDoge({ userId, room, userName: name })
      const roomUser = await repository.getRoomUser({ room, userId })
      const { doge_count: dogeCount } = roomUser
      const message = messages.getDogeMessage({ dogeCount, userId })
      await repository.updateLastRequest({ userId, room })

      sendThreadMessage({ res, message })
      addReactions({ message: res.message })
    }
  }

  async function getDoges(res) {
    console.log('getDoges...')
    const { room } = res.message
    const roomUsers = await repository.getRoomUsersForRoom({ room })
    roomUsers.sort((a, b) => (a.doge_count < b.doge_count ? 1 : -1))
    const message = messages.getDogeListMessage({ roomUsers, title: 'list' })

    sendThreadMessage({ res, message })
  }

  async function getHelp(res) {
    console.log('getHelp...')
    const message = messages.helpMessage()
    sendThreadMessage({ res, message })
  }

  async function getInfo(res) {
    console.log('getInfo...')
    const message = messages.infoMessage()
    sendThreadMessage({ res, message })
  }

  async function getHistory(res) {
    console.log('getHistory...')
    const { room } = res.message
    const roomUsers = await repository.getRoomHistory({ room })
    // roomUsers.sort((a, b) => a.doge_count < b.doge_count ? 1 : -1)
    const message = messages.getDogeListMessage({
      roomUsers,
      title: 'history',
    })

    sendThreadMessage({ res, message })
  }

  function addReactions({ message }) {
    console.log('addReactions...')
    reactions.forEach((reaction) =>
      web.reactions.add({
        name: reaction,
        channel: message.rawMessage.channel,
        timestamp: message.rawMessage.ts,
      })
    )
  }

  async function checkDogeRate({ userId, room }) {
    console.log('checkDogeRate...')
    const roomUser = await repository.getRoomUser({ room, userId })
    if (!roomUser || !roomUser.last_request_at) {
      return false
    }
    const lastRequest = new Date(roomUser.last_request_at).getTime()
    const now = Date.now()
    // one minutue
    return now - lastRequest < 60000
  }

  async function getCRMStock(res) {
    console.log('getCRMStock...', res.match)
    if (res.match.input.indexOf('doge crm blue') !== -1) {
      console.log('Wrong match')
      return
    }
    const stockPrice = await stockApi.getStockPrice('CRM')
    const stockPriceOpening = await stockApi.getStockPrice('CRM', 'day')
    const message = messages.getStockMessage(
      stockPrice,
      stockPrice - stockPriceOpening
    )
    sendMessage({ res, message })
  }

  async function getCRMPrediction(res) {
    console.log('getCRMPrediction...', res.match)
    let screenshotURL = await stockSentiment.getStockPrediction()
    let blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'CRM Prediction',
          emoji: true,
        },
      },
      {
        type: 'image',
        image_url: screenshotURL,
        alt_text: 'prediction',
      },
    ]
    let message = ''
    sendBlockMessage({ res, message, blocks })
  }

  async function getMeatPrice(res) {
    console.log('getMeatPrice...', res.match)
    if (res.match.input.indexOf('doge vacio blue') !== -1) {
      console.log('Wrong match')
      return
    }
    const meatPrice = await meatApi.getMeatPrice()
    const message = messages.getMeatMessage(meatPrice)
    sendMessage({ res, message })
  }

  async function getMeatBlue(res) {
    console.log('getMeatBlue...')
    const dollarBlue = await dolar.getDolarBlue()
    const meatPrice = await meatApi.getMeatPrice()
    const message = messages.getUSDMeatMessage(meatPrice/dollarBlue)
    sendMessage({ res, message })
    res.finish()
  }

  async function getDolarBlue(res) {
    console.log('getDolarBlue...', res.match)
    if (res.match.input.indexOf('doge blue crm') !== -1) {
      console.log('Wrong match')
      return
    }
    const dollarBlue = await dolar.getDolarBlue()
    const message = messages.getDolarBlueMessage(dollarBlue)
    sendMessage({ res, message })
  }

  async function getCRMBlue(res) {
    console.log('getCrmBlue...')
    const dollarBlue = await dolar.getDolarBlue()
    const stockPrice = await stockApi.getStockPrice('CRM')
    const message = messages.getCRMBlueMessage(dollarBlue * stockPrice)
    sendMessage({ res, message })
    res.finish()
  }

  function sendThreadMessage({ res, message }) {
    console.log('sendThreadMessage...')
    robot.adapter.client.web.chat.postMessage(res.message.user.room, message, {
      thread_ts: res.message.rawMessage.ts,
    })
  }

  function sendMessage({ res, message }) {
    console.log('sendMessage...')
    robot.adapter.client.web.chat.postMessage(res.message.user.room, message)
  }

  function sendBlockMessage({ res, message, blocks }) {
    robot.adapter.client.web.chat.postMessage(res.message.user.room, message, {
      attachments: [{ blocks: blocks }],
    })
  }
}
