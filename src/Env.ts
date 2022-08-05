import {
  LlamaPayFactoryContract,
  SUBGRAPH_URL,
  NETWORK_ID,
  RPC_URL,
  WUSD,
} from './constants'

class Env {
  static KEY = process.env.KEY || ''
  static LLAMA_PAY_FACTORY_CONTRACT =
    process.env.LLAMA_PAY_FACTORY_CONTRACT || LlamaPayFactoryContract
  static RPC_URL = process.env.RPC_URL || RPC_URL
  static NETWORK_ID = process.env.NETWORK_ID || NETWORK_ID
  static CLIENT_URL = process.env.CLIENT_URL || SUBGRAPH_URL
  static WUSD = process.env.WUSD || WUSD
}

export { Env }
