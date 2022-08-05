require('dotenv').config()

import chalk from 'chalk'
import { program } from 'commander'
import { isAddress } from '@ethersproject/address'

import { Env } from './Env'

import { UserWallet } from './UserWallet'
import { GraphService } from './services/GraphService'
import { LlamaPayService } from './services/LlamaPayService'
import { LlamaPayFactoryService } from './services/LlamaPayFactoryService'

import { HistoricalEvents } from './HistoricalEvents'
import { Streams } from './Streams'

import { amountAndDurationToAmountPerSecond } from './utils'

program
  .command('createLlamaPay')
  .alias('clp')
  .description(
    'create llamaPay through llamaPayFactory providing an ERC20 token'
  )
  .option('-t, --token <token>', 'token address', Env.WUSD)
  .action(async (options) => {
    const token = options.token
    if (!isAddress(token)) {
      console.log(chalk.red(`Token address ${token} is invalid`))
      return
    }

    await new LlamaPayFactoryService().createLlamaPay(token)
  })

program
  .command('createStream')
  .alias('cs')
  .description('create a stream to start paying a payee')
  .requiredOption('-p, --payee <payee>', 'Payee address')
  .requiredOption(
    '-a, --amount <amount>',
    'Amount of tokens to be paid to payee without decimals'
  )
  .requiredOption(
    '-d, --duration <duration>',
    'Total duration until the full amount paid to the payee. (ex: "1 month", "2 wk", etc)'
  )
  .option(
    '-t, --token <token>',
    'Token address that is used to create llama pay contract',
    Env.WUSD
  )
  .action(async (options) => {
    const svc = await LlamaPayFactoryService.tryGetLlamaPayService(
      options.token
    )
    if (!svc) {
      return
    }

    const amountPerSecond = amountAndDurationToAmountPerSecond(
      options.amount,
      options.duration
    )
    await svc.createStream(options.payee, amountPerSecond)
  })

program
  .command('cancelStream')
  .description(
    'cancel stream by stream ID. To get stream id, use the list command'
  )
  .requiredOption('-s, --streamId <streamId>', 'Stream ID')
  .option('-rpc, --rpc-url <rpcUrl>', 'The network rpc url', Env.RPC_URL)
  .action(async (options) => {
    const graphService = new GraphService()
    const { data } = await graphService.getStreamInfoByStreamId(
      options.streamId
    )
    if (!data.streams.length) {
      console.log(`No stream found for stream id ${options.streamId}`)
    }
    const { payee, amountPerSec, token } = data.streams[0]

    const svc = await LlamaPayFactoryService.tryGetLlamaPayService(
      token.address
    )
    if (svc) {
      await svc.cancelStream(payee.id, amountPerSec)
    }
  })

program
  .command('withdraw')
  .description('withdraw all tokens by stream id. this can be called by anyone')
  .requiredOption('-s, --streamId <streamId>', 'Stream ID')
  .action(async (options) => {
    const graphService = new GraphService()
    const { data } = await graphService.getStreamInfoByStreamId(
      options.streamId
    )

    if (!data.streams.length) {
      console.log(`No stream found for stream id ${options.streamId}`)
      return
    }

    const { payer, payee, amountPerSec, token } = data.streams[0]
    const svc = await LlamaPayFactoryService.tryGetLlamaPayService(
      token.address
    )
    if (!svc) {
      return
    }

    await svc.withdraw(payer.id, payee.id, amountPerSec)
  })

program
  .command('withdrawPayerAll')
  .description(
    'withdraw tokens for payer. the returning balance is the total balance subtracts the debt'
  )
  .option(
    '-t, --token <token>',
    'Token address that is used to create llama pay contract',
    Env.WUSD
  )
  .action(async (options) => {
    const svc = await LlamaPayFactoryService.tryGetLlamaPayService(
      options.token
    )
    if (svc) {
      await svc.withdrawPayerAll()
    }
  })

program
  .command('deposit')
  .description(
    'deposit the underlying token specified in the llamaPayContract to the contract. It will automatically approve the amount specified if allowance is not sufficient'
  )
  .option(
    '-t, --token <token>',
    'Token address that is used to create llama pay contract',
    Env.WUSD
  )
  .requiredOption(
    '-a, --amount <amount>',
    'Amount to be deposited without the decimals'
  )
  .action(async (options) => {
    const svc = await LlamaPayFactoryService.tryGetLlamaPayService(
      options.token
    )
    if (!svc) {
      return
    }

    await svc.deposit(options.amount)
  })

program
  .command('getStream')
  .alias('gs')
  .description(
    'get stream information including basic event history by stream id'
  )
  .requiredOption('-s, --streamId <streamId>', 'Stream ID')
  .action(async (options) => {
    const graphService = new GraphService()
    const { data } = await graphService.getStreamInfoByStreamId(
      options.streamId
    )
    if (!data.streams.length) {
      console.log(`No stream found for stream id ${options.streamId}`)
    }

    console.log(
      `\n==================== Query for stream id ${options.streamId} ========================\n`
    )

    // there could be multiple stream of the same id but have different contracts
    for (const [index, stream] of data.streams.entries()) {
      const userStreams = new Streams([data.streams[index]])
      const userEvents = new HistoricalEvents(stream.historicalEvents)
      await userStreams.displayStreams()
      await userEvents.displayBasicHistoryEvents()
    }
  })

program
  .command('list')
  .alias('ls')
  .description('list streams and historical events by payer or payee')
  .option(
    '-u, --user <user>',
    'Payer or Payee address (if not specified uses the user corresponding to the private key'
  )
  .option('--streamOnly')
  .option('--eventOnly')
  .action(async (options) => {
    if (!options.user && !Env.KEY) {
      console.log(chalk.red('--user <user> required when no key in .env'))
      return
    }
    const userAddress = options.user || new UserWallet().address()
    if (!isAddress(userAddress)) {
      console.log(chalk.red(`invalid address: ${userAddress}`))
      return
    }

    const graphService = new GraphService()
    const { data } = await graphService.getStreamAndHistoryByUserAddress(
      userAddress
    )

    const userStreams = new Streams(data.user?.streams)
    const userEvents = new HistoricalEvents(data.user?.historicalEvents)

    console.log(
      `\n==================== Query for User ${userAddress} ========================\n`
    )

    if (options.streamOnly) {
      await userStreams.displayStreams()
    } else if (options.eventOnly) {
      await userEvents.displayHistoryEvents()
    } else {
      await userStreams.displayStreams()
      await userEvents.displayHistoryEvents()
    }
  })

program
  .command('getWithdrawable')
  .alias('gw')
  .description(
    'get the stream withdrawable amount and what is owed by stream id'
  )
  .requiredOption('-s, --streamId <streamId>', 'Stream ID')
  .option('-rpc, --rpc-url <rpcUrl>', 'The network rpc url', Env.RPC_URL)
  .option('-n, --network <network>', 'Network Id', Env.NETWORK_ID)
  .action(async (options) => {
    const graphService = new GraphService()
    const { data } = await graphService.getStreamInfoByStreamId(
      options.streamId
    )
    if (!data.streams.length) {
      console.log(`No stream found for stream id ${options.streamId}`)
    }
    const { payer, payee, amountPerSec, token } = data.streams[0]
    const userWallet = new UserWallet()
    const { predictedAddress } = await new LlamaPayFactoryService(
      userWallet
    ).getLlamaPayContractDetailsByToken(token.address)
    await new LlamaPayService(
      userWallet,
      predictedAddress
    ).printWithdrawableByStreamId(payer.id, payee.id, amountPerSec)
  })

program.configureHelp({
  sortSubcommands: true,
})

async function run() {
  await program.parseAsync(process.argv)
}

;(async () => {
  await run()
})()
