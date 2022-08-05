import { table } from 'table'
import { BigNumber, ethers } from 'ethers'
import { UserStreamFragment } from 'services/generated/graphql'
import { LLAMA_DECIMALS } from './constants'
import { formatDate, truncate } from './utils'
import { Token } from './Token'

class Streams {
  private streams: UserStreamFragment[] | undefined

  constructor(streams: UserStreamFragment[] | undefined) {
    this.streams = streams
  }

  async displayStreams() {
    if (!this.streams?.length) {
      console.log(`No streams are available.`)
      return
    }

    const headers = [
      'stream_id',
      'llamapay contract',
      'active',
      'token address',
      'token symbol',
      'payer',
      'payee',
      'amount per sec',
      'created',
    ]

    console.log(
      `\n==================== Query streams ========================\n`
    )

    const tokenSymbols = await Promise.all(
      this.streams.map(async (s) => {
        return (await new Token(s.token.address).getTokenSymbolAndDecimals())
          .symbol
      })
    )

    const streamRows = []

    for (let [index, stream] of this.streams.entries()) {
      const amountPerSec = Number(
        ethers.utils.formatUnits(
          BigNumber.from(stream.amountPerSec),
          LLAMA_DECIMALS
        )
      ).toFixed(LLAMA_DECIMALS)
      streamRows.push([
        stream.streamId,
        truncate(stream.contract.address),
        stream.active,
        truncate(stream.token.address),
        tokenSymbols[index],
        truncate(stream.payer.id),
        truncate(stream.payee.id),
        amountPerSec,
        formatDate(new Date(stream.createdTimestamp * 1000)),
      ])
    }

    const streams = [headers].concat(streamRows)

    console.log(table(streams))
  }
}

export { Streams }
