import { log, Address } from '@graphprotocol/graph-ts'
import { ORACLE, USDC } from './constants'

import {
  SellOTokens as SellOTokensEvent,
  BuyOTokens as BuyOTokensEvent,
} from '../generated/OptionsExchange/OptionsExchange'

import { SellOTokens as SellOTokensEventV2 } from '../generated/OptionsExchangeV2/OptionsExchangeV2'

import { OptionsContract, SellOTokensAction, BuyOTokensAction } from '../generated/schema'

import { cToken as cTokenContract } from '../generated/OptionsExchange/cToken'
import { Oracle as OracleContract } from '../generated/OptionsExchange/Oracle'

export function handleSellOTokens(event: SellOTokensEvent): void {
  let optionsContract = OptionsContract.load(event.params.oTokenAddress.toHexString())
  if (optionsContract != null) {
    let actionId =
      'SELL-OTOKENS-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    let action = new SellOTokensAction(actionId)
    action.seller = event.params.seller
    action.transactionFrom = event.transaction.from
    action.receiver = event.params.receiver
    action.token = event.params.oTokenAddress.toHexString()
    action.payoutTokenAddress = event.params.payoutTokenAddress
    action.oTokensToSell = event.params.oTokensToSell
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp

    let oracle = OracleContract.bind(Address.fromString(ORACLE))
    action.payoutTokenPrice = oracle.getPrice(event.params.payoutTokenAddress)
    action.usdcPrice = oracle.getPrice(Address.fromString(USDC))

    action.save()
  } else {
    log.warning('handleSellOTokens: No OptionsContract with id {} found.', [
      event.params.oTokenAddress.toHexString(),
    ])
  }
}

export function handleSellOTokensV2(event: SellOTokensEventV2): void {
  let optionsContract = OptionsContract.load(event.params.oTokenAddress.toHexString())
  if (optionsContract != null) {
    let actionId =
      'SELL-OTOKENS-V2' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    let action = new SellOTokensAction(actionId)
    action.seller = event.params.seller
    action.transactionFrom = event.transaction.from
    action.receiver = event.params.receiver
    action.token = event.params.oTokenAddress.toHexString()
    action.payoutTokenAddress = event.params.payoutTokenAddress
    action.oTokensToSell = event.params.oTokensToSell
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp

    let oracle = OracleContract.bind(Address.fromString(ORACLE))
    action.payoutTokenPrice = oracle.getPrice(event.params.payoutTokenAddress)
    action.usdcPrice = oracle.getPrice(Address.fromString(USDC))
    action.payoutTokensReceived = event.params.payoutTokensReceived
    action.save()
  } else {
    log.warning('handleSellOTokensV2: No OptionsContract with id {} found.', [
      event.params.oTokenAddress.toHexString(),
    ])
  }
}

export function handleBuyOTokens(event: BuyOTokensEvent): void {
  let optionsContractId = event.params.oTokenAddress.toHexString()
  let optionsContract = OptionsContract.load(optionsContractId)
  let oracle = OracleContract.bind(Address.fromString(ORACLE))

  if (optionsContract != null) {
    let actionId =
      'BUY-OTOKENS-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    let action = new BuyOTokensAction(actionId)
    action.buyer = event.params.buyer
    action.receiver = event.params.receiver
    action.token = optionsContractId
    action.paymentTokenAddress = event.params.paymentTokenAddress
    action.oTokensToBuy = event.params.oTokensToBuy
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp
    action.premiumPaid = event.params.premiumPaid
    action.tokenUnderlyingAddress = optionsContract.underlying
    action.paymentTokenPrice = oracle.getPrice(event.params.paymentTokenAddress)
    action.usdcPrice = oracle.getPrice(Address.fromString(USDC))

    let cToken = cTokenContract.bind(
      Address.fromString(optionsContract.underlying.toHexString()),
    )
    let result = cToken.try_exchangeRateStored()
    // Try to sabe exchangeRateCurrent when the underlying is a cToken
    if (!result.reverted) {
      action.exchangeRateCurrent = result.value
      let cTokenUnderlying = cToken.underlying()
      let underlyingPrice = oracle.getPrice(cTokenUnderlying)
      action.cTokenUnderlyingPrice = underlyingPrice
    } else {
      log.warning('handleBuyOTokens: Underlying {} is not cToken.', [
        optionsContract.underlying.toHexString(),
      ])
    }

    action.save()
  } else {
    log.warning('handleBuyOTokens: No OptionsContract with id {} found.', [
      optionsContractId,
    ])
  }
}
