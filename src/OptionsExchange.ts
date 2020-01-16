import {
  SellOTokens as SellOTokensEvent,
  BuyOTokens as BuyOTokensEvent,
} from '../generated/OptionsExchange/OptionsExchange'

import { SellOTokensAction, BuyOTokensAction } from '../generated/schema'

export function handleSellOTokens(event: SellOTokensEvent): void {
  let actionId =
    'SELL-OTOKENS-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  let action = new SellOTokensAction(actionId)
  action.seller = event.params.seller
  action.receiver = event.params.receiver
  action.oTokenAddress = event.params.oTokenAddress
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
  action.oTokenAddress = event.params.oTokenAddress
  action.paymentTokenAddress = event.params.paymentTokenAddress
  action.oTokensToBuy = event.params.oTokensToBuy
  action.block = event.block.number
  action.transactionHash = event.transaction.hash
  action.timestamp = event.block.timestamp
  action.save()
}
