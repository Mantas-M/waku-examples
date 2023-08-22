import { Waku } from 'waku-admin/waku'

const node = Waku.initializeNode().then((node) => {
  console.log('Node initialized')
  return node
})

export default node
