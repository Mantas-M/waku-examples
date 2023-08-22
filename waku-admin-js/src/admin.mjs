import { createDecoder as eciesDecoder } from '@waku/message-encryption/ecies'
import { createDecoder } from '@waku/sdk'
import { Rentality } from './rentality.mjs'
import {
  Waku,
  getTripChatContentTopic,
  PublicKeyMessage,
  JoinChatContentTopic,
  ChatMessage,
} from './waku.mjs'
import {
  generateEncryptionKeyPair,
  verifyEncryptionKeySignature,
} from './crypto.mjs'

export class Admin {
  constructor() {
    this.roomInfo = new Map()
    this.rentality = new Rentality()
    this.onJoinChatRequest = this.onJoinChatRequest.bind(this)
    this.onTripChatMessage = this.onTripChatMessage.bind(this)
    Waku.initializeNode()
      .then((node) => {
        this.node = node
        console.log('Admin node initialized')
        this.listenForRoomRequests()
      })
      .catch((err) => {
        throw new Error(err)
      })
  }

  async listenForRoomRequests() {
    await this.node.filter.subscribe(
      [createDecoder(JoinChatContentTopic)],
      this.onJoinChatRequest,
    )
    console.log('Listening for join chat requests\n')
  }

  async onJoinChatRequest(msg) {
    if (!msg.payload) return
    const publicKeyMsg = PublicKeyMessage.decode(msg.payload)
    if (!publicKeyMsg) return
    console.log('Received join chat request')

    const tripId = Number(publicKeyMsg.tripId)

    // getting addresses from smart contract
    const { hostAddress, guestAddress } =
      await this.rentality.getAddressesByTripId(tripId)
    if (!hostAddress || !guestAddress) return

    console.log('Host address', hostAddress)
    console.log('Guest address', guestAddress)

    if (
      publicKeyMsg.ethAddress.toLowerCase() === hostAddress.toLowerCase() ||
      publicKeyMsg.ethAddress.toLowerCase() === guestAddress.toLowerCase()
    ) {
      console.log(`Reqested to join chat ${tripId}`)

      console.log('Verifying signature')
      const valid = await verifyEncryptionKeySignature(
        publicKeyMsg.signature,
        publicKeyMsg.encryptionPublicKey,
        publicKeyMsg.ethAddress,
      )
      if (!valid) {
        console.log('Invalid signature')
        return
      }
      console.log('Signature is valid')
      console.log('User is a member of this chat')

      const isHost =
        publicKeyMsg.ethAddress.toLowerCase() === hostAddress.toLowerCase()
          ? true
          : false

      let publicKey
      if (this.roomInfo.has(tripId)) {
        console.log('Already have encryption key')
        const existingData = this.roomInfo.get(tripId)

        isHost
          ? this.roomInfo.set(tripId, {
              ...existingData,
              hostPublicKey: publicKeyMsg.encryptionPublicKey,
            })
          : this.roomInfo.set(tripId, {
              ...existingData,
              guestPublicKey: publicKeyMsg.encryptionPublicKey,
            })

        publicKey = existingData.keys.publicKey
      } else {
        console.log('Generating encryption key')
        const keys = generateEncryptionKeyPair()

        isHost
          ? this.roomInfo.set(tripId, {
              hostPublicKey: publicKeyMsg.encryptionPublicKey,
              keys,
            })
          : this.roomInfo.set(tripId, {
              guestPublicKey: publicKeyMsg.encryptionPublicKey,
              keys,
            })

        publicKey = keys.publicKey

        await this.node.filter.subscribe(
          eciesDecoder(getTripChatContentTopic(tripId), keys.privateKey),
          this.onTripChatMessage,
        )
        console.log(`Listening for trip ${tripId} messages \n`)
      }

      console.log('Sending encryption key to user')
      await Waku.sendEncryptedChatPublicKeyMessage(
        tripId,
        publicKeyMsg.ethAddress,
        publicKey,
        publicKeyMsg.encryptionPublicKey,
        this.node,
      )
    } else {
      console.log('User is not a member of this chat')
    }
  }

  async onTripChatMessage(msg) {
    if (!msg.payload) return
    const chatMessage = ChatMessage.decode(msg.payload)
    if (!chatMessage) return

    // Check signature of message
    console.log(`Trip Id: ${chatMessage.tripId} `)
    console.log(`Sender: ${chatMessage.sender} `)
    console.log(`Message: ${chatMessage.message} `)

    const hostPublicKey = this.roomInfo.get(chatMessage.tripId).hostPublicKey
    const guestPublicKey = this.roomInfo.get(chatMessage.tripId).guestPublicKey

    if (hostPublicKey) {
      console.log(`Host is connected, forwarding message `)

      await Waku.forwardChatMessage(
        chatMessage.tripId,
        hostPublicKey,
        chatMessage.message,
        chatMessage.sender,
        this.node,
      )
    }

    if (guestPublicKey) {
      console.log(`Guest is connected, forwarding message `)

      await Waku.forwardChatMessage(
        chatMessage.tripId,
        guestPublicKey,
        chatMessage.message,
        chatMessage.sender,
        this.node,
      )
    }
  }
}
