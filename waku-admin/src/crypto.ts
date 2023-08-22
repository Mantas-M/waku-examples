import { Wallet, ethers } from 'ethers'
// import { generatePrivateKey, getPublicKey } from '@waku/message-encryption'

// export function generateEncryptionKeyPair() {
//   // const privateKey = generatePrivateKey()
//   // const publicKey = getPublicKey(privateKey)
//   return { privateKey, publicKey }
// }

export async function verifyEncryptionKeySignature(
  signature: string,
  encryptionPublicKey: Uint8Array,
  signerAddress: string,
) {
  const message = {
    encryptionPublicKey: encryptionPublicKey,
    ethAddress: signerAddress,
  }

  const messageBytes = ethers.utils.toUtf8Bytes(message.toString())
  const messageHash = ethers.utils.keccak256(messageBytes)

  const recoveredAddress = ethers.utils.verifyMessage(
    ethers.utils.arrayify(messageHash),
    signature,
  )

  return recoveredAddress.toLowerCase() === signerAddress.toLowerCase()
}

export async function signChatMessage(message: string, signer: Wallet) {
  const chatMessage = {
    message: message,
    sender: signer.address,
  }

  const messageBytes = ethers.utils.toUtf8Bytes(chatMessage.toString())
  const messageHash = ethers.utils.keccak256(messageBytes)
  const signature = await signer.signMessage(ethers.utils.arrayify(messageHash))
  return signature
}

export function verifyChatMessageSignature(
  signature: string,
  message: string,
  sender: string,
) {
  const chatMessage = {
    message: message,
    sender: sender,
  }

  const messageBytes = ethers.utils.toUtf8Bytes(chatMessage.toString())
  const messageHash = ethers.utils.keccak256(messageBytes)

  const recoveredAddress = ethers.utils.verifyMessage(
    ethers.utils.arrayify(messageHash),
    signature,
  )

  return recoveredAddress.toLowerCase() === sender.toLowerCase()
}
