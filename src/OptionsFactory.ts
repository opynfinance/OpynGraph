import { Address, BigInt, log, store } from '@graphprotocol/graph-ts'

import { OptionsFactory, OptionsContractCreated, AssetAdded, AssetChanged, AssetDeleted, OwnershipTransferred } from '../generated/OptionsFactory/OptionsFactory'

import { OptionsContract } from '../generated/OptionsFactory/OptionsContract'

import { OptionsContract as OptionsContractTemplate } from '../generated/templates'

import {
  OptionsFactory as OptionsFactoryState,
  SupportedAsset,
  AssetAdded as AssetAddedState,
  AssetChanged as AssetChangedState,
  AssetDeleted as AssetDeletedState,
  FactoryOwnershipTransferred,
  OptionsContract as OptionsContractEntity
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

export function handleOptionsContractCreated(event: OptionsContractCreated): void {
  let optionsAddress = event.params.addr

  // Start traking the new OptionsContract
  OptionsContractTemplate.create(optionsAddress)

  // Bind OptionsContract for getting its data
  let boundOptionsContract = OptionsContract.bind(optionsAddress)
  let owner = boundOptionsContract.owner()
  let collateralizationRatio = boundOptionsContract.collateralizationRatio()
  let oTokenExchangeRate = boundOptionsContract.oTokenExchangeRate()
  let strikePrice = boundOptionsContract.strikePrice()
  let expiry = boundOptionsContract.expiry()
  let collateral = boundOptionsContract.collateral()
  let underlying = boundOptionsContract.underlying()
  let strike = boundOptionsContract.strike()

  // Create new entity
  let optionsContract = new OptionsContractEntity(optionsAddress.toHexString())
  optionsContract.address = optionsAddress
  optionsContract.owner = owner
  optionsContract.collateralizationRatioValue = collateralizationRatio.value0
  optionsContract.collateralizationRatioExp = BigInt.fromI32(collateralizationRatio.value1)
  optionsContract.oTokenExchangeRateValue = oTokenExchangeRate.value0
  optionsContract.oTokenExchangeRateExp = BigInt.fromI32(oTokenExchangeRate.value1)
  optionsContract.strikePriceValue = strikePrice.value0
  optionsContract.strikePriceExp = BigInt.fromI32(strikePrice.value1)
  optionsContract.expiry = expiry
  optionsContract.collateral = collateral
  optionsContract.underlying = underlying
  optionsContract.strike = strike
  optionsContract.totalCollateral = BIGINT_ZERO
  optionsContract.totalLiquidated = BIGINT_ZERO
  optionsContract.totalExercised = BIGINT_ZERO
  optionsContract.totalUnderlying = BIGINT_ZERO
  optionsContract.block = event.block.number
  optionsContract.transactionHash = event.transaction.hash
  optionsContract.timestamp = event.block.timestamp
  optionsContract.save()
}

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

export function handleAssetChanged(event: AssetChanged): void {
  getOptionsFactory(event.address)

  let asset = SupportedAsset.load(event.params.asset.toHexString())

  if (asset !== null) {
    let oldAddress = asset.address
    asset.address = event.params.addr
    asset.save()

    let actionId = 'ASSET-CHANGED-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    let action = new AssetChangedState(actionId)
    action.factory = OPTION_CONTRACT_STATE_KEY
    action.asset = event.params.asset.toHexString()
    action.oldAddress = oldAddress
    action.newAddress = event.params.addr
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp
    action.save()
  } else {
    log.warning('handleAssetChanged: No Asset with id {} found.', [event.params.asset.toHexString()])
  }
}

export function handleAssetDeleted(event: AssetDeleted): void {
  getOptionsFactory(event.address)

  let asset = SupportedAsset.load(event.params.asset.toHexString())

  if (asset !== null) {
    store.remove('SupportedAsset', event.params.asset.toHexString())

    let actionId = 'ASSET-DELETED-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    let action = new AssetDeletedState(actionId)
    action.factory = OPTION_CONTRACT_STATE_KEY
    action.asset = event.params.asset.toHexString()
    action.address = asset.address
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp
    action.save()
  } else {
    log.warning('handleAssetChanged: No Asset with id {} found.', [event.params.asset.toHexString()])
  }
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  let optionFactory = getOptionsFactory(event.address)
  optionFactory.owner = event.params.newOwner
  optionFactory.save()

  let actionId = 'OWNERSHIP-TRANFERRED-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  let action = new FactoryOwnershipTransferred(actionId)
  action.factory = OPTION_CONTRACT_STATE_KEY
  action.oldOwner = event.params.previousOwner
  action.newOwner = event.params.newOwner
  action.block = event.block.number
  action.transactionHash = event.transaction.hash
  action.timestamp = event.block.timestamp
  action.save()
}
