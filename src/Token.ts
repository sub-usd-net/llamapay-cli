import { BigNumber, Contract, ethers, Wallet } from 'ethers'
import { ContractTransaction } from '@ethersproject/contracts'
import { getERC20ContractAbi } from './utils'
import { UserWallet } from './UserWallet'

class Token {
  private tokenContract: Contract

  constructor(
    tokenAddress: string,
    private wallet: UserWallet = new UserWallet()
  ) {
    this.tokenContract = wallet.createContractWithSigner(
      tokenAddress,
      getERC20ContractAbi()
    )
  }

  async getTokenSymbolAndDecimals(): Promise<{
    symbol: string
    decimals: number
  }> {
    const [symbol, decimals] = await Promise.all([
      this.tokenContract.symbol(),
      this.tokenContract.decimals(),
    ])
    return {
      symbol,
      decimals,
    }
  }

  async approve(to: string, amount: BigNumber): Promise<ContractTransaction> {
    return this.tokenContract.approve(to, amount.toHexString())
  }

  async allowance(owner: string, spender: string): Promise<BigNumber> {
    return this.tokenContract.allowance(owner, spender)
  }

  async balanceOf(owner: string): Promise<BigNumber> {
    return this.tokenContract.balanceOf(owner)
  }
}

export { Token }
