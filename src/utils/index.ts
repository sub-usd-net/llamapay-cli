import fs from 'fs'
import parseDuration from 'parse-duration'
import { BigNumber, ContractInterface, ethers } from 'ethers'

import { LLAMA_DECIMALS } from '../constants'
import { solidityKeccak256 } from 'ethers/lib/utils'
import moment from 'moment'
import { isAddress } from '@ethersproject/address'

function interfaceFromABIFile(path: string): ContractInterface {
  return JSON.parse(fs.readFileSync(path).toString())
}

function getLlamaPayContractAbi(): ContractInterface {
  return interfaceFromABIFile('src/abi/llamaPay.json')
}

function getLlamaPayFactoryContractAbi(): ContractInterface {
  return interfaceFromABIFile('src/abi/LlamaPayFactory.json')
}

function getERC20ContractAbi(): ContractInterface {
  return interfaceFromABIFile('src/abi/ERC20.json')
}

function formatDate(date: Date): string {
  return moment(date).format('YYYY-MM-DD HH:mm:ss')
}

function isAddressOrHash(s: string): boolean {
  return s.startsWith('0x') && (isAddress(s) || s.length == 66)
}

function truncate(s: string): string {
  if (!isAddressOrHash(s)) {
    return s
  }
  return s.substring(0, 6) + '...' + s.substring(s.length - 4)
}

// deterministic streamId
function getStreamId(
  from: string,
  to: string,
  amountPerSec: BigNumber
): string {
  return solidityKeccak256(
    ['address', 'address', 'uint216'],
    [from, to, amountPerSec]
  )
}

/**
 * @param amount amount of tokens without including native token decimals
 * @param duration human-readable duration (ex: 1day, 1month, 2week)
 */
function amountAndDurationToAmountPerSecond(
  amount: string,
  duration: string
): BigNumber {
  const durationInSeconds = Math.floor(parseDuration(duration) / 1000)
  return ethers.utils.parseUnits(amount, LLAMA_DECIMALS).div(durationInSeconds)
}

export {
  amountAndDurationToAmountPerSecond,
  getLlamaPayContractAbi,
  getERC20ContractAbi,
  getLlamaPayFactoryContractAbi,
  getStreamId,
  formatDate,
  truncate,
}
