import { ethers, ContractInterface, Wallet, Contract } from 'ethers'
import { Env } from './Env'

class UserWallet {
  private readonly wallet: Wallet
  private readonly provider: any

  constructor() {
    if (!Env.RPC_URL) {
      throw new Error(`.env RPC_URL is required`)
    }
    if (!Env.KEY) {
      throw new Error('.env KEY variable must exist')
    }

    this.provider = new ethers.providers.JsonRpcProvider(Env.RPC_URL)
    this.wallet = new ethers.Wallet(Env.KEY, this.provider)
  }

  address(): string {
    return this.wallet.address
  }

  createContractWithSigner(
    contractAddress: string,
    abi: ContractInterface
  ): Contract {
    return new ethers.Contract(contractAddress, abi, this.wallet)
  }
}

export { UserWallet }
