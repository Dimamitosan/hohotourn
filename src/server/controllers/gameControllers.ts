import User from '../../models/User'

function getRandomNumbers(n: number) {
  const numbers = Array.from({ length: n }, (_, i) => i + 1)
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
  }
  return numbers
}

export const setNumbers = async (socket: any, code: string) => {
  const countOfUsers = User.findAll({ where: { lobbyCode: code } })
  const rundomArr = getRandomNumbers((await countOfUsers).length)
  countOfUsers.then((arr) => {
    arr.map(async (user) => {
      await User.update({ number: rundomArr.pop() }, { where: { id: user.id } })
    })
  })
}

export const sendQuestion = async (socket: any, [question, code]: string[]) => {
  await User.update({ question: question }, { where: { socket: socket.id } })

  const countOfPlayers = await User.count({ where: { lobbyCode: code } })
  const userNumber = await User.findOne({
    where: { socket: socket.id },
  })
  if (userNumber && userNumber.number) {
    // }).then((user) => {
    //   user?.number
    // })
    // for (let i = 1; i <= countOfPlayers; i++) {

    const firstUserForQuestion = await User.findOne({
      where: {
        lobbyCode: code,
        number: (userNumber?.number % countOfPlayers) + 1,
      },
    })
    const secondUserForQuestion = await User.findOne({
      where: {
        lobbyCode: code,
        number: ((userNumber?.number + 1) % countOfPlayers) + 1,
      },
    })

    console.log(
      firstUserForQuestion?.question,
      firstUserForQuestion?.number,
      secondUserForQuestion?.question,
      secondUserForQuestion?.number,

      userNumber.number,
      socket.id,
      '------------вопросы'
    )
    socket.emit('getQuestions', [
      firstUserForQuestion?.question,
      secondUserForQuestion?.question,
    ])
  }
  // }
}

export const getScores = async (socket: any, code: string) => {
  try {
    const users = await User.findAll({ where: { lobbyCode: code } })
    const scoresArray = users.map((user) => [user.nick, user.score]) // Формируем массив [имя, очки]

    socket.emit('scoresData', scoresArray) // Отправляем данные клиенту
  } catch (e) {
    console.log('ошибка -', e)
  }
}
