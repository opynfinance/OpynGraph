import { log, Address } from '@graphprotocol/graph-ts'
import { ORACLE, USDC } from './constants'

import {
  SellOTokens as SellOTokensEvent,
  BuyOTokens as BuyOTokensEvent,
} from '../generated/OptionsExchange/OptionsExchange'

import { OptionsContract, SellOTokensAction, BuyOTokensAction } from '../generated/schema'

import { cToken as cTokenContract } from '../generated/OptionsExchange/cToken'
import { Oracle as OracleContract } from '../generated/OptionsExchange/Oracle'

export function handleSellOTokens(event: SellOTokensEvent): void {
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
  action.save()
}

export function handleBuyOTokens(event: BuyOTokensEvent): void {
  log.error('handleBuyOTokens {}', [event.params.oTokenAddress.toHex()])

  let actionId =
    'BUY-OTOKENS-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  let action = new BuyOTokensAction(actionId)
  action.buyer = event.params.buyer
  action.receiver = event.params.receiver
  action.token = event.params.oTokenAddress.toHexString()
  action.paymentTokenAddress = event.params.paymentTokenAddress
  action.oTokensToBuy = event.params.oTokensToBuy
  action.block = event.block.number
  action.transactionHash = event.transaction.hash
  action.timestamp = event.block.timestamp
  action.premiumPaid = event.params.premiumPaid

  // Try to sabe exchangeRateCurrent when the underlying is a cToken
  let optionsContractId = event.params.oTokenAddress.toHexString()
  let optionsContract = OptionsContract.load(optionsContractId)

  let oracle = OracleContract.bind(Address.fromString(ORACLE))

  if (optionsContract != null) {
    action.tokenUnderlyingAddress = optionsContract.underlying

    let cToken = cTokenContract.bind(
      Address.fromString(optionsContract.underlying.toHexString()),
    )
    let result = cToken.try_exchangeRateStored()
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
  } else {
    log.warning('handleBuyOTokens: No OptionsContract with id {} found.', [
      optionsContractId,
    ])
  }

  let paymentTokenPrice = oracle.getPrice(event.params.paymentTokenAddress)
  let usdcPrice = oracle.getPrice(Address.fromString(USDC))

  action.paymentTokenPrice = paymentTokenPrice
  action.usdcPrice = usdcPrice

  action.save()
}
