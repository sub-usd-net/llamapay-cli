import { HistoryEvent } from 'services/generated/graphql'
import { table } from 'table'
import { BigNumber, ethers } from 'ethers'
import { formatDate } from './utils'

type BasicHistoricalEvent = {
  __typename?: 'HistoryEvent'
  eventType: string
  txHash: any
  createdTimestamp: any
}

class HistoricalEvents {
  private historicalEvents: HistoryEvent[] | BasicHistoricalEvent[] | undefined

  constructor(
    historicalEvents: HistoryEvent[] | BasicHistoricalEvent[] | undefined
  ) {
    this.historicalEvents = historicalEvents
  }

  async displayBasicHistoryEvents() {
    if (!this.historicalEvents?.length) {
      console.log(`No events are available.`)
      return
    }

    const headers = ['index', 'tx_hash', 'event_type', 'created']

    console.log(
      `\n==================== Query historical events ========================\n`
    )

    const historicalEvents = [headers].concat(
      this.historicalEvents.map((historicalEvent, index) => {
        return [
          index,
          historicalEvent.txHash,
          historicalEvent.eventType,
          new Date(historicalEvent.createdTimestamp * 1000),
        ]
      })
    )

    console.log(table(historicalEvents))
  }

  async displayHistoryEvents() {
    if (!this.historicalEvents?.length) {
      console.log(`No events are available.`)
      return
    }

    const headers = [
      'index',
      'tx_hash',
      'event_type',
      'amount_without_decimals',
      'created',
    ]

    console.log(
      `\n==================== Query historical events ========================\n`
    )
    const historicalEvents = [headers].concat(
      this.historicalEvents.map((historicalEvent, index) => {
        if ('amount' in historicalEvent) {
          let sanitizedAmount = historicalEvent.amount
            ? Number(
                ethers.utils.formatUnits(
                  BigNumber.from(historicalEvent.amount),
                  historicalEvent.token.decimals
                )
              ).toFixed(2)
            : historicalEvent.amount
          return [
            index,
            historicalEvent.txHash,
            historicalEvent.eventType,
            sanitizedAmount,
            formatDate(new Date(historicalEvent.createdTimestamp * 1000)),
          ]
        } else {
          throw new Error('Amount does not exist in HistoryEvent.')
        }
      })
    )

    console.log(table(historicalEvents))
  }
}

export { HistoricalEvents, BasicHistoricalEvent }
