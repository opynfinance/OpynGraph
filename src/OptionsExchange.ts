import { log, Address } from '@graphprotocol/graph-ts'

import {
  SellOTokens as SellOTokensEvent,
  BuyOTokens as BuyOTokensEvent,
} from '../generated/OptionsExchange/OptionsExchange'

import { OptionsContract, SellOTokensAction, BuyOTokensAction } from '../generated/schema'

import { cToken as cTokenContract } from '../generated/OptionsExchange/cToken'

export function handleSellOTokens(event: SellOTokensEvent): void {
  let actionId =
    'SELL-OTOKENS-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  let action = new SellOTokensAction(actionId)
  action.seller = event.params.seller
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

  // Try to sabe exchangeRateCurrent when the underlying is a cToken
  let optionsContractId = event.params.oTokenAddress.toHexString()
  let optionsContract = OptionsContract.load(optionsContractId)

  if (optionsContract !== null) {
    let cToken = cTokenContract.bind(
      Address.fromString(optionsContract.underlying.toHexString()),
    )
    let result = cToken.try_exchangeRateStored()
    if (!result.reverted) {
      action.exchangeRateCurrent = result.value
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

  action.save()
}
