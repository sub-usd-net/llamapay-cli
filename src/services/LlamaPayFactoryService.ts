import chalk from 'chalk'
import { Contract } from 'ethers'

import { Env } from '../Env'
import { UserWallet } from '../UserWallet'
import { getLlamaPayFactoryContractAbi } from '../utils'
import { LlamaPayService } from './LlamaPayService'

class LlamaPayFactoryService {
  private contract: Contract

  constructor(private wallet: UserWallet = new UserWallet()) {
    this.contract = wallet.createContractWithSigner(
      Env.LLAMA_PAY_FACTORY_CONTRACT,
      getLlamaPayFactoryContractAbi()
    )
  }

  public async getLlamaPayContractDetailsByToken(token: string): Promise<{
    predictedAddress: string
    isDeployed: boolean
  }> {
    return this.contract.getLlamaPayContractByToken(token)
  }

  public async getLlamaPayServiceByToken(
    token: string
  ): Promise<LlamaPayService | null> {
    const { predictedAddress, isDeployed } =
      await this.contract.getLlamaPayContractByToken(token)
    if (!isDeployed) {
      console.log(
        chalk.red(
          `llama pay with token ${token} has not been created. Use createLlamaPay to create one.`
        )
      )
      return null
    }
    return new LlamaPayService(this.wallet, predictedAddress)
  }

  public static async tryGetLlamaPayService(
    token: string,
    wallet: UserWallet = new UserWallet()
  ): Promise<LlamaPayService | null> {
    return new LlamaPayFactoryService(wallet).getLlamaPayServiceByToken(token)
  }

  public async createLlamaPay(token: string) {
    const { predictedAddress, isDeployed } =
      await this.getLlamaPayContractDetailsByToken(token)
    if (isDeployed) {
      console.log(
        chalk.green(
          `LlamaPay for token=${token} already exists. address=${predictedAddress}`
        )
      )
      return
    }

    console.log(
      chalk.green(
        `Sending transaction to create llamaPay for token=${token} (will be created at ${predictedAddress})`
      )
    )

    try {
      const receipt = await (
        await this.contract.createLlamaPayContract(token)
      ).wait()
      console.log(`Transaction succeeded. TxHash: ${receipt.transactionHash}`)
    } catch (err: any) {
      console.log(`An error has occurred: ${err.message}`)
      return
    }
  }
}

export { LlamaPayFactoryService }
