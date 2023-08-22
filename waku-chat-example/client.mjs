import {
  Waku,
  getUserKeysContentTopic,
  ChatPublicKeyMessage,
  getTripChatContentTopic,
  ForwardedMessage,
} from './waku.mjs'
import { generateEncryptionKeyPair } from './crypto.mjs'
import { Ethers } from './ethers.mjs'
// import { createEncoder, createDecoder } from '@waku/sdk'
import { createDecoder as eciesDecoder } from '@waku/message-encryption/ecies'

export class Client {
  constructor(clientName) {
    this.roomKeys = new Map()
    this.ethers = new Ethers()
    this.encryptionKeyPair = generateEncryptionKeyPair()
    this.wallet = this.ethers.getClientWallet(clientName)
    this.sendMessage = this.sendMessage.bind(this)
    this.onChatEncryptionKey = this.onChatEncryptionKey.bind(this)
    this.onChatMessage = this.onChatMessage.bind(this)
  }

  async init(clientName) {
    this.node = await Waku.initializeNode()
    console.log(`Initialized Waku node for client ${clientName}`)
  }

  async listenForChatEncryptionKeys(walletAddress) {
    await this.node.filter.subscribe(
      eciesDecoder(
        getUserKeysContentTopic(walletAddress),
        this.encryptionKeyPair.privateKey
      ),
      this.onChatEncryptionKey
    )

    console.log(
      `Listening for chat encryption keys at ${getUserKeysContentTopic(
        walletAddress
      )}`
    )
  }

  async listenForChatMessages(tripId) {
    await this.node.filter.subscribe(
      eciesDecoder(
        getTripChatContentTopic(tripId),
        this.encryptionKeyPair.privateKey
      ),
      this.onChatMessage
    )

    console.log(`Listening for messages at ${getTripChatContentTopic(tripId)}`)
  }

  async sendRoomKeyRequest(tripId) {
    await Waku.sendPublicKeyMessage(
      tripId,
      this.encryptionKeyPair.publicKey,
      this.wallet,
      this.node
    )
  }

  async onChatEncryptionKey(msg) {
    if (!msg.payload) return
    const publicKeyMsg = ChatPublicKeyMessage.decode(msg.payload)
    if (!publicKeyMsg) return

    const tripId = Number(publicKeyMsg.tripId)

    console.log('\n\nReceived chat encryption key')
    this.roomKeys.set(tripId, publicKeyMsg.chatPublicKey)
    console.log(`Set chat encryption key for trip ${tripId}\n`)
    await this.listenForChatMessages(tripId)
  }

  async sendMessage(tripId, message) {
    const roomKey = this.roomKeys.get(tripId)
    if (!roomKey) {
      console.log(`No room key for trip ${tripId}`)
      return
    }

    await Waku.sendChatMessage(tripId, message, this.wallet, roomKey, this.node)
  }

  onChatMessage(msg) {
    if (!msg.payload) return
    const chatMessage = ForwardedMessage.decode(msg.payload)
    if (!chatMessage) return
    if (
      String(chatMessage.sender).toLowerCase() ===
      this.wallet.address.toLowerCase()
    )
      return

    console.log(`\n\nReceived chat message from ${chatMessage.sender}`)
    console.log(`Message: ${chatMessage.message}\n`)
  }

  get walletAddress() {
    return this.wallet.address
  }
}
