import { ethers, Contract } from 'ethers'
import contractABI from './abi/rentality-abi.json' assert { type: 'json' }
import * as dotenv from 'dotenv'
dotenv.config()

export class Rentality {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
    this.contractAddress = process.env.CONTRACT_ADDRESS
    this.contract = new ethers.Contract(
      this.contractAddress,
      contractABI,
      this.provider,
    )
  }

  async getAddressesByTripId(tripId) {
    const trip = await this.contract.getTrip(tripId)

    const guestAddress = trip[3]
    const hostAddress = trip[4]

    if (
      guestAddress === '0x0000000000000000000000000000000000000000' ||
      hostAddress === '0x0000000000000000000000000000000000000000'
    ) {
      console.log('Trip not found')
      return { hostAddress: null, guestAddress: null }
    }

    console.log('Trip found')
    return { hostAddress, guestAddress }
  }
}
