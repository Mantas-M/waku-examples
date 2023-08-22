import { Ethers } from './ethers.mjs'

export class SmartContract {
  static getAddressesByTripId(tripId) {
    // Get the addresses from the smart contract
    // ...
    // await contract.getAddressesByTripId(tripId);

    console.log(`Getting addresses for trip ${tripId}`)

    if (tripId === 3) {
      return {
        hostAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        guestAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      }
    } else if (tripId === 4) {
      return {
        hostAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        guestAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      }
    }
  }
}
