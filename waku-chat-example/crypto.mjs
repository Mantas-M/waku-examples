import { PublicKeyMessage, ChatMessage } from './waku.mjs'
import { ethers } from 'ethers'
import { bytesToHex, hexToBytes } from '@waku/utils/bytes'
import { generatePrivateKey, getPublicKey } from '@waku/message-encryption'

export function generateEncryptionKeyPair() {
  const privateKey = generatePrivateKey()
  const publicKey = getPublicKey(privateKey)
  return { privateKey, publicKey }
}

export async function createPublicKeyMessage(
  tripId,
  encryptionPublicKey,
  signer
) {
  const signature = await signEncryptionKey(encryptionPublicKey, signer)

  return new PublicKeyMessage({
    encryptionPublicKey: encryptionPublicKey,
    ethAddress: hexToBytes(signer.address),
    signature: hexToBytes(signature),
    tripId: tripId,
  })
}

export async function createChatMessage(tripId, message, sender) {
  const signature = await signChatMessage(message, sender)

  return new ChatMessage({
    tripId: tripId,
    message: message,
    sender: hexToBytes(sender.address),
    signature: hexToBytes(signature),
  })
}

export async function signEncryptionKey(encryptionPublicKey, signer) {
  const message = {
    encryptionPublicKey: encryptionPublicKey,
    ethAddress: signer.address,
  }

  const messageBytes = ethers.utils.toUtf8Bytes(message)
  const messageHash = ethers.utils.keccak256(messageBytes)
  const signature = await signer.signMessage(ethers.utils.arrayify(messageHash))
  return signature
}

export async function verifyEncryptionKeySignature(
  signature,
  encryptionPublicKey,
  signerAddress
) {
  const message = {
    encryptionPublicKey: encryptionPublicKey,
    ethAddress: signerAddress,
  }

  const messageBytes = ethers.utils.toUtf8Bytes(message)
  const messageHash = ethers.utils.keccak256(messageBytes)

  const recoveredAddress = ethers.utils.verifyMessage(
    ethers.utils.arrayify(messageHash),
    signature
  )

  return recoveredAddress.toLowerCase() === signerAddress.toLowerCase()
}

export async function signChatMessage(message, signer) {
  const chatMessage = {
    message: message,
    sender: signer.address,
  }

  const messageBytes = ethers.utils.toUtf8Bytes(chatMessage)
  const messageHash = ethers.utils.keccak256(messageBytes)
  const signature = await signer.signMessage(ethers.utils.arrayify(messageHash))
  return signature
}

export function verifyChatMessageSignature(signature, message, sender) {
  const chatMessage = {
    message: message,
    sender: sender,
  }

  const messageBytes = ethers.utils.toUtf8Bytes(chatMessage)
  const messageHash = ethers.utils.keccak256(messageBytes)

  const recoveredAddress = ethers.utils.verifyMessage(
    ethers.utils.arrayify(messageHash),
    signature
  )

  return recoveredAddress.toLowerCase() === sender.toLowerCase()
}
