import { ethers } from 'ethers'

export class Ethers {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(
      'http://localhost:8545'
    )

    // First 4 accounts from hardhat node
    this.trip3GuestWallet = new ethers.Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      this.provider
    )
    this.trip4GuestWallet = new ethers.Wallet(
      '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
      this.provider
    )
    this.hostWallet = new ethers.Wallet(
      '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
      this.provider
    )
    this.anonWallet = new ethers.Wallet(
      '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
      this.provider
    )
  }

  getClientWallet(clientName) {
    switch (clientName) {
      case 'trip-3-guest':
        return this.trip3GuestWallet
      case 'trip-4-guest':
        return this.trip4GuestWallet
      case 'host':
        return this.hostWallet
      case 'anon':
        return this.anonWallet
      default:
        throw new Error('Invalid client name')
    }
  }

  getTrip3GuestWallet() {
    return this.trip3GuestWallet
  }

  getTrip4GuestWallet() {
    return this.trip4GuestWallet
  }

  getHostWallet() {
    return this.hostWallet
  }

  getAnonWallet() {
    return this.anonWallet
  }

  get trip3GuestAddress() {
    return '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  }

  get trip4GuestAddress() {
    return '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
  }

  get hostAddress() {
    return '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
  }

  get anonAddress() {
    return '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
  }
}
