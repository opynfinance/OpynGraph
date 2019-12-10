import { Address, BigInt } from '@graphprotocol/graph-ts'

import { OptionsFactory, OptionsContractCreated, AssetAdded, AssetChanged, AssetDeleted, OwnershipTransferred } from '../generated/OptionsFactory/OptionsFactory'

import {
  OptionsFactory as OptionsFactoryState,
  SupportedAsset,
  AssetAdded as AssetAddedState
} from '../generated/schema'

import { BIGINT_ZERO } from './helpers'

const OPTION_CONTRACT_STATE_KEY = '0'

export function getOptionsFactory(address: Address): OptionsFactoryState {
  let state = OptionsFactoryState.load(OPTION_CONTRACT_STATE_KEY)

  if (state == null) {
    state = new OptionsFactoryState(OPTION_CONTRACT_STATE_KEY)
    let storage = OptionsFactory.bind(address)

    state.optionsExchangeAddress = storage.optionsExchange()
    state.owner = storage.owner()
    state.save()
  }

  return state as OptionsFactoryState
}

export function handleOptionsContractCreated(event: OptionsContractCreated): void {}

export function handleAssetAdded(event: AssetAdded): void {
  getOptionsFactory(event.address)

  let asset = new SupportedAsset(event.params.asset.toHexString())
  asset.asset = event.params.asset.toHexString()
  asset.address = event.params.addr
  asset.save()

  let actionId = 'ASSET-ADDED-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  let action = new AssetAddedState(actionId)
  action.factory = OPTION_CONTRACT_STATE_KEY
  action.asset = event.params.asset.toHexString()
  action.address = event.params.addr
  action.block = event.block.number
  action.transactionHash = event.transaction.hash
  action.timestamp = event.block.timestamp
  action.save()
}

export function handleAssetChanged(event: AssetChanged): void {}

export function handleAssetDeleted(event: AssetDeleted): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}
