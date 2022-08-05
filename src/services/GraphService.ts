import { GraphQLClient } from 'graphql-request'
import {
  GetAllTokensQuery,
  GetAllTokensQueryVariables,
  getSdk,
  Scalars,
  StreamAndHistoryQuery,
  StreamAndHistoryQueryVariables,
  StreamByIdQuery,
  StreamByIdQueryVariables,
} from './generated/graphql' // THIS FILE IS THE GENERATED FILE
import { Headers, RequestInit } from 'graphql-request/dist/types.dom'
import { isAddress } from '@ethersproject/address'

import { Env } from '../Env'

class GraphService {
  private readonly networkId: string
  private sdk: {
    StreamById(
      variables: StreamByIdQueryVariables,
      requestHeaders?: RequestInit['headers']
    ): Promise<{
      data: StreamByIdQuery
      extensions?: any
      headers: Headers
      status: number
    }>
    GetAllTokens(
      variables: GetAllTokensQueryVariables,
      requestHeaders?: RequestInit['headers']
    ): Promise<{
      data: GetAllTokensQuery
      extensions?: any
      headers: Headers
      status: number
    }>
    StreamAndHistory(
      variables: StreamAndHistoryQueryVariables,
      requestHeaders?: RequestInit['headers']
    ): Promise<{
      data: StreamAndHistoryQuery
      extensions?: any
      headers: Headers
      status: number
    }>
  }

  constructor() {
    this.networkId = Env.NETWORK_ID
    const client = new GraphQLClient(Env.CLIENT_URL)
    this.sdk = getSdk(client)
  }

  async getStreamAndHistoryByUserAddress(userAddress: string): Promise<{
    data: StreamAndHistoryQuery
    extensions?: any
    headers: Headers
    status: number
  }> {
    if (!isAddress(userAddress)) {
      throw new Error(`User address ${userAddress} is invalid`)
    }

    return this.sdk.StreamAndHistory({
      network: this.networkId,
      id: userAddress.toLowerCase(),
    })
  }

  async getStreamInfoByStreamId(streamId: Scalars['Bytes']): Promise<{
    data: StreamByIdQuery
    extensions?: any
    headers: Headers
    status: number
  }> {
    return this.sdk.StreamById({
      network: this.networkId,
      id: streamId,
    })
  }
}

export { GraphService }
