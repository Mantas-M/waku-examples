process.env.DEBUG = 'waku*,libp2p*'
import { Admin } from './admin.mjs'

const admin = new Admin()

await admin.init()

await admin.listenForRoomRequests()
