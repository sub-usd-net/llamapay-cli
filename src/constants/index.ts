const LlamaPayFactoryContract = '0xf8f63878d5d1e6fb8629450aa8b05b8bd3ceb0db' // subnet llama pay factory

const NETWORK_ID = '52125' // network id for the subnet
const SUBGRAPH_URL = 'https://graph-api.test.snowgenesis.com/llamapay' // subgraph url for the subnet
const RPC_URL = 'https://usd.test.snowgenesis.com/rpc/' // rpc url for the subnet
const WUSD = '0xc2d087e6db960f561da48e406eda2f8e09fe92e9' // wusd for the subnet

// lamapay uses a standard 20 decimals when creating/modifying streams
const LLAMA_DECIMALS = 20

export {
  LLAMA_DECIMALS,
  LlamaPayFactoryContract,
  NETWORK_ID,
  SUBGRAPH_URL,
  RPC_URL,
  WUSD,
}
