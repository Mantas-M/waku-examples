import { Client } from './client.mjs'
import inquirer from 'inquirer'

process.env.DEBUG = 'waku*,libp2p*'

const actions = [
  'request room 3 key',
  'request room 4 key',
  'send message to room 3',
  'send message to room 4',
  'exit',
]

async function performAction(client, action) {
  switch (action) {
    case 'request room 3 key':
      await client.sendRoomKeyRequest(3)
      break
    case 'request room 4 key':
      await client.sendRoomKeyRequest(4)
      break
    case 'send message to room 3':
      const msgRoom3 = await promptForMessage()
      await client.sendMessage(3, msgRoom3)
      break
    case 'send message to room 4':
      const msgRoom4 = await promptForMessage()
      await client.sendMessage(4, msgRoom4)
      break
  }
}

async function promptForMessage() {
  const { message } = await inquirer.prompt([
    {
      type: 'input',
      name: 'message',
      message: 'Enter your chat message:',
    },
  ])
  return message
}

async function promptForAction(client) {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Which action do you want to choose?',
      choices: actions,
    },
  ])

  if (action === 'exit') {
    return
  }

  await performAction(client, action)
  await promptForAction(client)
}

inquirer
  .prompt([
    {
      type: 'list',
      name: 'clientChoice',
      message: 'Which client do you want to choose?',
      choices: ['trip-3-guest', 'trip-4-guest', 'host', 'anon'],
    },
  ])
  .then(async (answers) => {
    const client = new Client(answers.clientChoice)
    await client.init(answers.clientChoice)
    await client.listenForChatEncryptionKeys(client.walletAddress)

    await promptForAction(client)
  })
