import { Address, log } from '@graphprotocol/graph-ts'

import { DAI, USDC, OPTIONS_EXCHANGE } from './constants'
import { Approval as ApprovalEvent } from '../generated/templates/ApprovalToken/ApprovalToken'
import { Approval } from '../generated/schema'

export function handleApproval(event: ApprovalEvent): void {
  if (event.params.spender.toHex() != OPTIONS_EXCHANGE) {
    return
  }

  let symbol = getTokenSymbol(event.address)

  if (symbol != '-') {
    let approval = new Approval(
      symbol + '-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
    )
    approval.approvedToken = symbol
    approval.approvedTokenAddress = event.address
    approval.owner = event.params.owner
    approval.value = event.params.value
    approval.block = event.block.number
    approval.transactionHash = event.transaction.hash
    approval.timestamp = event.block.timestamp
    approval.save()
  } else {
    log.warning('handleApproval: No allowed token {}.', [event.address.toHexString()])
  }
}

function getTokenSymbol(address: Address): string {
  if (address.toHex() == DAI) {
    return 'DAI'
  }

  if (address.toHex() == USDC) {
    return 'USDC'
  }

  return '-'
}
