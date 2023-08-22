export type PublicKeyMessagePayload = {
  encryptionPublicKey: Uint8Array
  ethAddress: Uint8Array
  signature: Uint8Array
  tripId: number
}

export type ChatPublicKeyMessagePayload = {
  tripId: number
  chatPublicKey: Uint8Array
}

export type ChatMessagePayload = {
  tripId: number
  message: string
  sender: Uint8Array
  signature: Uint8Array
}

export type ForwardedMessagePayload = {
  message: string
  sender: Uint8Array
}

export type KeyPair = {
  privateKey: Uint8Array
  publicKey: Uint8Array
}

export type RoomInfo = {
  hostPublicKey?: Uint8Array
  guestPublicKey?: Uint8Array
  keys: KeyPair
}
