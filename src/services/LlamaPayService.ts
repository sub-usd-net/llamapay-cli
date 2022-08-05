import chalk from 'chalk'
import {
  BigNumber,
  BigNumberish,
  Contract,
  ContractReceipt,
  ContractTransaction,
  ethers,
} from 'ethers'

import { Token } from '../Token'
import { UserWallet } from '../UserWallet'
import { getLlamaPayContractAbi, getStreamId } from '../utils'
import { LLAMA_DECIMALS } from '../constants'
import { formatUnits } from 'ethers/lib/utils'

enum Methods {
  CreateStream = 'createStream',
  CancelStream = 'cancelStream',
  Withdraw = 'withdraw',
  WithdrawPayerAll = 'withdrawPayerAll',
  Deposit = 'deposit',
}

class LlamaPayService {
  private readonly contract: Contract

  constructor(
    private wallet: UserWallet,
    private llamaPayContractAddress: string
  ) {
    this.contract = this.wallet.createContractWithSigner(
      this.llamaPayContractAddress,
      getLlamaPayContractAbi()
    )
  }

  private async submitTx(
    method: string,
    ...args: any[]
  ): Promise<ContractTransaction | null> {
    try {
      const tx = await this.contract[method](...args)
      console.log(`Submitting transaction ${tx.hash}`)
      return tx
    } catch (err: any) {
      console.log(
        `Error occurred creating or sending the transaction: ${err.message}`
      )
      return null
    }
  }

  private async submitTxAndWait(
    method: string,
    ...args: any[]
  ): Promise<ContractReceipt | null> {
    const tx = await this.submitTx(method, ...args)
    if (!tx) {
      return null
    }

    try {
      return await tx.wait()
    } catch (err: any) {
      console.log(
        `Error occurred waiting for transaction to commit: ${err.message}`
      )
      return null
    }
  }

  private async getPayerBalance(): Promise<BigNumber> {
    return await this.contract.getPayerBalance(this.wallet.address())
  }

  private async checkIfStreamExists(
    payee: string,
    amountPerSec: BigNumber
  ): Promise<boolean> {
    const streamId = getStreamId(this.wallet.address(), payee, amountPerSec)
    const res = await this.contract.streamToStart(streamId)
    return res.toNumber() !== 0
  }

  private async checkIfDebtExists(): Promise<{
    hasDebt: boolean
    balance: string
  }> {
    const balance = await this.getPayerBalance()
    if (balance.lt(BigNumber.from(0))) {
      const debt = formatUnits(balance.mul(BigNumber.from(-1)), LLAMA_DECIMALS)
      const debtHuman = parseFloat(debt).toFixed(8)
      return {
        hasDebt: true,
        balance: debtHuman,
      }
    }
    const balanceHuman = parseFloat(
      formatUnits(balance, LLAMA_DECIMALS)
    ).toFixed(8)
    return {
      hasDebt: false,
      balance: balanceHuman,
    }
  }

  public async createStream(
    payee: string,
    amountPerSec: BigNumber
  ): Promise<ContractReceipt | null> {
    const exists = await this.checkIfStreamExists(payee, amountPerSec)
    if (exists) {
      console.log(
        chalk.green(
          'Stream already exists for this (payer, payee, amountPerSec)'
        )
      )
      return null
    }

    const { hasDebt, balance } = await this.checkIfDebtExists()
    if (hasDebt) {
      console.log(
        chalk.red(
          `Payer (${this.wallet.address()}) has an outstanding debt ${balance}. Cannot createStream until this balance is paid. Keep in mind that the balance increases every second`
        )
      )
      return null
    }

    console.log('Sending transaction to create stream for...')
    console.log('----------------------------------')
    console.log(`Payer: ${this.wallet.address()}`)
    console.log(`Payee: ${payee}`)
    console.log(`Amount Per Second: ${amountPerSec}`)
    console.log('----------------------------------')
    return this.submitTxAndWait(Methods.CreateStream, payee, amountPerSec)
  }

  public async cancelStream(
    payee: string,
    amountPerSec: BigNumber
  ): Promise<ContractReceipt | null> {
    console.log(`Sending transaction to cancel stream for`)
    console.log('----------------------------------')
    console.log(`Payer: ${this.wallet.address()}`)
    console.log(`Payee: ${payee}`)
    console.log(`Amount Per Second: ${amountPerSec}`)
    console.log('----------------------------------')
    return this.submitTxAndWait(Methods.CancelStream, payee, amountPerSec)
  }

  public async withdraw(
    payer: string,
    payee: string,
    amountPerSec: BigNumber
  ): Promise<ContractReceipt | null> {
    console.log(
      `Sending transaction to withdraw tokens from payer: ${payer} to payee: ${payee}`
    )
    return this.submitTxAndWait(Methods.Withdraw, payer, payee, amountPerSec)
  }

  public async withdrawPayerAll(): Promise<ContractReceipt | null> {
    const { hasDebt, balance } = await this.checkIfDebtExists()
    if (hasDebt) {
      console.log(
        chalk.red(
          `Payer (${this.wallet.address()}) has an outstanding debt ${balance}. Cannot withdrawPayerAll until this balance is paid. Keep in mind that the balance increases every second`
        )
      )
      return null
    }
    return this.submitTxAndWait(Methods.WithdrawPayerAll)
  }
  public async deposit(tokenAmount: string): Promise<ContractReceipt | null> {
    const tokenAddress = await this.contract.token()
    const token = new Token(tokenAddress, this.wallet)
    const { symbol, decimals } = await token.getTokenSymbolAndDecimals()
    const amount = BigNumber.from(tokenAmount).mul(
      BigNumber.from('10').pow(decimals)
    )

    try {
      const balance = await token.balanceOf(this.wallet.address())
      const hasSufficientBalance = balance.gte(amount)
      if (!hasSufficientBalance) {
        console.log(
          chalk.red(
            `Payer (${this.wallet.address()}) has insufficient balance of ${symbol}. Desired deposit amount: ${amount}. Balance: ${balance}`
          )
        )
        return null
      }
      const allowance = await token.allowance(
        this.wallet.address(),
        this.llamaPayContractAddress
      )
      if (allowance.gte(amount)) {
        console.log(
          `token allowance is sufficient. skipping the approval step.`
        )
      } else {
        console.log(
          `================ approving llamapay contract for token ${symbol} ================`
        )
        const tokenApprovedReceipt = await (
          await token.approve(this.llamaPayContractAddress, amount)
        ).wait()
        console.log(
          `token approved. txHash: ${tokenApprovedReceipt.transactionHash}`
        )
      }
      console.log(
        `================ depositing token ${symbol} to llamapay contract ================`
      )
      const depositReceipt = await (await this.contract.deposit(amount)).wait()
      console.log(`token deposited. txHash: ${depositReceipt.transactionHash}`)
      return depositReceipt
    } catch (err: any) {
      console.log(`An error has occurred: ${err.message}`)
      return null
    }
  }

  async printWithdrawableByStreamId(
    payer: string,
    payee: string,
    amountPerSec: BigNumberish
  ) {
    const token = new Token(this.contract.token(), this.wallet)
    const { symbol, decimals } = await token.getTokenSymbolAndDecimals()
    const { withdrawableAmount, owed } = await this.contract.withdrawable(
      payer,
      payee,
      amountPerSec
    )

    console.log(
      `====================== withdrawable for user ${payee} for token ${symbol} ======================`
    )
    console.log(
      `Withdrawable token amount: ${Number(
        ethers.utils.formatUnits(withdrawableAmount, decimals)
      ).toFixed(2)}`
    )
    console.log(
      `Owed token amount: ${Number(
        ethers.utils.formatUnits(owed, decimals)
      ).toFixed(2)}`
    )
  }
}

export { LlamaPayService }
