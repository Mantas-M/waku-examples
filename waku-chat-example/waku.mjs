import { createLightNode, createRelayNode } from '@waku/sdk'
import { waitForRemotePeer } from '@waku/sdk'
import { createEncoder, createDecoder } from '@waku/sdk'
import {
  createEncoder as eciesEncoder,
  createDecoder as eciesDecoder,
} from '@waku/message-encryption/ecies'
import { Protocols } from '@waku/interfaces'
import protobuf from 'protobufjs'
import { createChatMessage, createPublicKeyMessage } from './crypto.mjs'
import { bytesToHex, hexToBytes } from '@waku/utils/bytes'

export class PublicKeyMessage {
  static Type = new protobuf.Type('PublicKeyMessage')
    .add(new protobuf.Field('encryptionPublicKey', 1, 'bytes'))
    .add(new protobuf.Field('ethAddress', 2, 'bytes'))
    .add(new protobuf.Field('signature', 3, 'bytes'))
    .add(new protobuf.Field('tripId', 4, 'uint64'))

  constructor(payload) {
    this.payload = payload
  }

  encode() {
    const message = PublicKeyMessage.Type.create(this.payload)
    return PublicKeyMessage.Type.encode(message).finish()
  }

  static decode(bytes) {
    const payload = PublicKeyMessage.Type.decode(bytes)

    if (
      !payload.signature ||
      !payload.encryptionPublicKey ||
      !payload.ethAddress ||
      !payload.tripId
    ) {
      console.log('Field missing on decoded Public Key Message', payload)
      return
    }

    return new PublicKeyMessage({
      encryptionPublicKey: payload.encryptionPublicKey,
      ethAddress: '0x' + bytesToHex(payload.ethAddress),
      signature: '0x' + bytesToHex(payload.signature),
      tripId: payload.tripId,
    })
  }

  get encryptionPublicKey() {
    return this.payload.encryptionPublicKey
  }

  get ethAddress() {
    return this.payload.ethAddress
  }

  get signature() {
    return this.payload.signature
  }

  get tripId() {
    return this.payload.tripId
  }
}

export class ChatPublicKeyMessage {
  static Type = new protobuf.Type('ChatPublicKeyMessage')
    .add(new protobuf.Field('tripId', 1, 'uint64'))
    .add(new protobuf.Field('chatPublicKey', 2, 'bytes'))

  constructor(payload) {
    this.payload = payload
  }

  encode() {
    const message = ChatPublicKeyMessage.Type.create(this.payload)
    return ChatPublicKeyMessage.Type.encode(message).finish()
  }

  static decode(bytes) {
    const payload = ChatPublicKeyMessage.Type.decode(bytes)

    if (!payload.chatPublicKey || !payload.tripId) {
      console.log('Field missing on decoded Public Key Message', payload)
      return
    }

    return new ChatPublicKeyMessage(payload)
  }

  get chatPublicKey() {
    return this.payload.chatPublicKey
  }

  get tripId() {
    return this.payload.tripId
  }
}

export class ChatMessage {
  static Type = new protobuf.Type('ChatMessage')
    .add(new protobuf.Field('tripId', 1, 'uint64'))
    .add(new protobuf.Field('message', 2, 'string'))
    .add(new protobuf.Field('sender', 3, 'bytes'))
    .add(new protobuf.Field('signature', 4, 'bytes'))

  constructor(payload) {
    this.payload = payload
  }

  encode() {
    const message = ChatMessage.Type.create(this.payload)
    return ChatMessage.Type.encode(message).finish()
  }

  static decode(bytes) {
    const payload = ChatMessage.Type.decode(bytes)

    if (
      !payload.message ||
      !payload.signature ||
      !payload.tripId ||
      !payload.sender
    ) {
      console.log('Field missing on decoded Chat Message', payload)
      return
    }

    return new ChatMessage({
      tripId: Number(payload.tripId),
      message: payload.message,
      signature: '0x' + bytesToHex(payload.signature),
      sender: '0x' + bytesToHex(payload.sender),
    })
  }

  get message() {
    return this.payload.message
  }

  get signature() {
    return this.payload.signature
  }

  get tripId() {
    return this.payload.tripId
  }

  get sender() {
    return this.payload.sender
  }
}

export class ForwardedMessage {
  static Type = new protobuf.Type('ForwardedMessage')
    .add(new protobuf.Field('message', 1, 'string'))
    .add(new protobuf.Field('sender', 2, 'bytes'))

  constructor(payload) {
    this.payload = payload
  }

  encode() {
    const message = ForwardedMessage.Type.create(this.payload)
    return ForwardedMessage.Type.encode(message).finish()
  }

  static decode(bytes) {
    const payload = ForwardedMessage.Type.decode(bytes)

    if (!payload.message || !payload.sender) {
      console.log('Field missing on decoded Forwarded Message', payload)
      return
    }

    return new ForwardedMessage({
      message: payload.message,
      sender: '0x' + bytesToHex(payload.sender),
    })
  }

  get message() {
    return this.payload.message
  }

  get sender() {
    return this.payload.sender
  }
}

export const JoinChatContentTopic = '/rentality/1/join-chat/proto'
export function getTripChatContentTopic(tripId) {
  return `/rentality/1/pm-trip-${tripId}/proto`
}
export function getUserKeysContentTopic(address) {
  return `/rentality/1/chat-keys-${String(address).toLowerCase()}/proto`
}

export class Waku {
  static async initializeNode() {
    console.log('Initializing node')
    const node = await createLightNode({ defaultBootstrap: true })
    await node.start()
    await waitForRemotePeer(node, [Protocols.Filter, Protocols.LightPush])
    console.log('Node initialized')
    return node
  }

  static async listenForJoinChatRequests(node) {
    await node.filter.subscribe(
      [createDecoder(JoinChatContentTopic)],
      (message) => {
        console.log('Received join chat request', message)
      }
    )
    console.log('Listening for join chat requests')
  }

  static async sendPublicKeyMessage(tripId, encryptionPublicKey, wallet, node) {
    console.log('wallet address', wallet.address)

    const message = await createPublicKeyMessage(
      tripId,
      encryptionPublicKey,
      wallet
    )

    const payload = message.encode()
    const encoder = createEncoder({ contentTopic: JoinChatContentTopic })

    await node.lightPush.send(encoder, { payload })
    console.log(`Message sent to ${JoinChatContentTopic}\n`)
  }

  static async sendEncryptedChatPublicKeyMessage(
    tripId,
    userWalletAddress,
    chatPublicKey,
    userPublicKey,
    node
  ) {
    const message = new ChatPublicKeyMessage({
      tripId: tripId,
      chatPublicKey: chatPublicKey,
    })

    const payload = message.encode()
    const encoder = eciesEncoder({
      contentTopic: getUserKeysContentTopic(userWalletAddress),
      publicKey: userPublicKey,
      ephemeral: true,
    })

    await node.lightPush.send(encoder, { payload })
    console.log(
      `Message sent to ${getUserKeysContentTopic(userWalletAddress)}\n`
    )
  }

  static async sendChatMessage(tripId, message, wallet, chatPublicKey, node) {
    const chatMessage = await createChatMessage(tripId, message, wallet)

    const payload = chatMessage.encode()
    const encoder = eciesEncoder({
      contentTopic: getTripChatContentTopic(tripId),
      publicKey: chatPublicKey,
      ephemeral: true,
    })

    await node.lightPush.send(encoder, { payload })
    console.log(`Message sent to ${getTripChatContentTopic(tripId)}\n`)
  }

  static async forwardChatMessage(
    tripId,
    userPublicKey,
    message,
    sender,
    node
  ) {
    const messageToForward = new ForwardedMessage({
      message: message,
      sender: hexToBytes(sender),
    })

    const payload = messageToForward.encode()
    const encoder = eciesEncoder({
      contentTopic: getTripChatContentTopic(tripId),
      publicKey: userPublicKey,
      ephemeral: true,
    })

    await node.lightPush.send(encoder, { payload })
    console.log(`Message forwarded to ${getTripChatContentTopic(tripId)}\n`)
  }
}
