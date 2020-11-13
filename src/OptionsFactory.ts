import { Address, BigInt, log, store } from '@graphprotocol/graph-ts'
import { DAI, USDC } from './constants'
import {
  OptionsFactory as OptionFactoryContract,
  OptionsContractCreated as OptionsContractCreatedEvent,
  AssetAdded as AssetAddedEvent,
  AssetChanged as AssetChangedEvent,
  AssetDeleted as AssetDeletedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
} from '../generated/OptionsFactory/OptionsFactory'
import { ERC20 as ERC20Contract } from "../generated/OptionsFactory/ERC20"
import { OptionsContract as OptionsContractSmartContract } from '../generated/OptionsFactory/OptionsContract'
import { isZeroAddress } from './helpers'
import {
  OptionsContract as OptionsContractTemplate,
  ApprovalToken as ApprovalTokenTemplate,
} from '../generated/templates'

import {
  ERC20,
  OptionsFactoryCounter,
  OptionsFactory,
  SupportedAsset,
  AssetAddedAction,
  AssetChangedAction,
  AssetDeletedAction,
  OptionsContractCreatedAction,
  FactoryOwnershipTransferredAction,
  OptionsContract,
} from '../generated/schema'

import { BIGINT_ZERO, BIGINT_ONE, isBlackListed } from './helpers'

const OPTION_CONTRACT_STATE_KEY = '0'

function getFactoryCounter(): OptionsFactoryCounter {
  let counter = OptionsFactoryCounter.load('0')
  if (counter == null) {
    counter = new OptionsFactoryCounter('0')
    counter.optionsFactoryCount = BIGINT_ZERO
    counter.save()
  }

  return counter as OptionsFactoryCounter
}

export function getOptionsFactory(address: Address): OptionsFactory {
  let counter = getFactoryCounter()
  let state = OptionsFactory.load(address.toHexString())

  if (state == null) {
    state = new OptionsFactory(address.toHexString())
    let boundOptionFactory = OptionFactoryContract.bind(address)

    state.optionsExchangeAddress = boundOptionFactory.optionsExchange()
    state.oracleAddress = boundOptionFactory.oracleAddress()
    state.owner = boundOptionFactory.owner()
    state.actionCount = BIGINT_ZERO
    state.optionsContractCreatedCount = BIGINT_ZERO
    state.assetAddedCount = BIGINT_ZERO
    state.assetChangedCount = BIGINT_ZERO
    state.assetDeletedCount = BIGINT_ZERO
    state.factoryOwnershipTransferredCount = BIGINT_ZERO

    state.save()

    if (counter.optionsFactoryCount.equals(BIGINT_ZERO)) {
      // Start traking the DAI approval
      ApprovalTokenTemplate.create(Address.fromString(DAI))

      // Start traking the USDC approval
      ApprovalTokenTemplate.create(Address.fromString(USDC))
    }

    counter.optionsFactoryCount = counter.optionsFactoryCount.plus(BIGINT_ONE)
    counter.save()
  }

  return state as OptionsFactory
}

export function handleOptionsContractCreated(event: OptionsContractCreatedEvent): void {
  let optionsAddress = event.params.addr

  // Do not track some test oTokens
  if (isBlackListed(optionsAddress)) {
    return
  }

  // Start traking the new OptionsContract
  OptionsContractTemplate.create(optionsAddress)

  // Bind OptionsContract for getting its data
  let boundOptionsContract = OptionsContractSmartContract.bind(optionsAddress)

  let underlying = boundOptionsContract.underlying()
  let owner = boundOptionsContract.owner()
  let optionsExchangeAddress = boundOptionsContract.optionsExchange()
  let oracleAddress = boundOptionsContract.COMPOUND_ORACLE()
  let liquidationIncentive = boundOptionsContract.liquidationIncentive()
  let transactionFee = boundOptionsContract.transactionFee()
  let liquidationFactor = boundOptionsContract.liquidationFactor()
  let minCollateralizationRatio = boundOptionsContract.minCollateralizationRatio()
  let oTokenExchangeRate = boundOptionsContract.oTokenExchangeRate()
  let strikePrice = boundOptionsContract.strikePrice()
  let expiry = boundOptionsContract.expiry()
  let collateral = boundOptionsContract.collateral()
  let strike = boundOptionsContract.strike()

  // Create new entity
  let optionsContract = new OptionsContract(optionsAddress.toHexString())
  optionsContract.address = optionsAddress
  optionsContract.owner = owner
  optionsContract.optionsExchangeAddress = optionsExchangeAddress
  optionsContract.oracleAddress = oracleAddress
  optionsContract.liquidationIncentiveValue = liquidationIncentive.value0
  optionsContract.liquidationIncentiveExp = BigInt.fromI32(liquidationIncentive.value1)
  optionsContract.transactionFeeValue = transactionFee.value0
  optionsContract.transactionFeeExp = BigInt.fromI32(transactionFee.value1)
  optionsContract.liquidationFactorValue = liquidationFactor.value0
  optionsContract.liquidationFactorExp = BigInt.fromI32(liquidationFactor.value1)
  optionsContract.minCollateralizationRatioValue = minCollateralizationRatio.value0
  optionsContract.minCollateralizationRatioExp = BigInt.fromI32(
    minCollateralizationRatio.value1,
  )
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

  optionsContract.eventCount = BIGINT_ZERO
  optionsContract.burnEventCount = BIGINT_ZERO
  optionsContract.mintEventCount = BIGINT_ZERO
  optionsContract.transferEventCount = BIGINT_ZERO
  optionsContract.totalSupply = BIGINT_ZERO
  optionsContract.totalBurned = BIGINT_ZERO
  optionsContract.totalMinted = BIGINT_ZERO
  optionsContract.totalTransferred = BIGINT_ZERO

  optionsContract.actionCount = BIGINT_ZERO
  optionsContract.vaultOpenedCount = BIGINT_ZERO
  optionsContract.transferFeeCount = BIGINT_ZERO
  optionsContract.optionsContractOwnershipTransferredCount = BIGINT_ZERO
  optionsContract.updateParametersCount = BIGINT_ZERO

  optionsContract.save()

  let actionId =
    'OPTIONS-CREATED-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  let action = new OptionsContractCreatedAction(actionId)
  action.factory = OPTION_CONTRACT_STATE_KEY
  action.address = optionsAddress
  action.block = event.block.number
  action.transactionHash = event.transaction.hash
  action.timestamp = event.block.timestamp
  action.save()

  let optionFactory = getOptionsFactory(event.address)
  optionFactory.actionCount = optionFactory.actionCount.plus(BIGINT_ONE)
  optionFactory.optionsContractCreatedCount = optionFactory.optionsContractCreatedCount.plus(
    BIGINT_ONE,
  )
  optionFactory.save()
}

export function handleAssetAdded(event: AssetAddedEvent): void {

  // Create ERC20 instance
  let tokenAddress = event.params.addr
  let entity = new ERC20(tokenAddress.toHex())
  if (isZeroAddress(tokenAddress)) { // it's ETH
    entity.symbol = 'ETH'
    entity.name = 'Ether'
    entity.decimals = 18
  } else {
    let contract = ERC20Contract.bind(tokenAddress)
    entity.symbol = contract.symbol()
    entity.name = contract.name()
    entity.decimals = contract.decimals()
  }
  entity.save();

  let optionFactory = getOptionsFactory(event.address)

  let asset = new SupportedAsset(event.params.asset.toHexString())
  asset.asset = event.params.asset.toHexString()
  asset.address = event.params.addr
  asset.save()

  let actionId =
    'ASSET-ADDED-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  let action = new AssetAddedAction(actionId)
  action.factory = OPTION_CONTRACT_STATE_KEY
  action.asset = event.params.asset.toHexString()
  action.address = event.params.addr
  action.block = event.block.number
  action.transactionHash = event.transaction.hash
  action.timestamp = event.block.timestamp
  action.save()

  optionFactory.actionCount = optionFactory.actionCount.plus(BIGINT_ONE)
  optionFactory.assetAddedCount = optionFactory.assetAddedCount.plus(BIGINT_ONE)
  optionFactory.save()
}

export function handleAssetChanged(event: AssetChangedEvent): void {
  let optionFactory = getOptionsFactory(event.address)

  let asset = SupportedAsset.load(event.params.asset.toHexString())

  if (asset != null) {
    let oldAddress = asset.address
    asset.address = event.params.addr
    asset.save()

    let actionId =
      'ASSET-CHANGED-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    let action = new AssetChangedAction(actionId)
    action.factory = OPTION_CONTRACT_STATE_KEY
    action.asset = event.params.asset.toHexString()
    action.oldAddress = oldAddress
    action.newAddress = event.params.addr
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp
    action.save()

    optionFactory.actionCount = optionFactory.actionCount.plus(BIGINT_ONE)
    optionFactory.assetChangedCount = optionFactory.assetChangedCount.plus(BIGINT_ONE)
    optionFactory.save()
  } else {
    log.warning('handleAssetChanged: No Asset with id {} found.', [
      event.params.asset.toHexString(),
    ])
  }
}

export function handleAssetDeleted(event: AssetDeletedEvent): void {
  let optionFactory = getOptionsFactory(event.address)

  let asset = SupportedAsset.load(event.params.asset.toHexString())

  if (asset != null) {
    store.remove('SupportedAsset', event.params.asset.toHexString())

    let actionId =
      'ASSET-DELETED-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    let action = new AssetDeletedAction(actionId)
    action.factory = OPTION_CONTRACT_STATE_KEY
    action.asset = event.params.asset.toHexString()
    action.address = asset.address
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp
    action.save()

    optionFactory.actionCount = optionFactory.actionCount.plus(BIGINT_ONE)
    optionFactory.assetAddedCount = optionFactory.assetAddedCount.plus(BIGINT_ONE)
    optionFactory.save()
  } else {
    log.warning('handleAssetChanged: No Asset with id {} found.', [
      event.params.asset.toHexString(),
    ])
  }
}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {
  let optionFactory = getOptionsFactory(event.address)
  optionFactory.owner = event.params.newOwner
  optionFactory.actionCount = optionFactory.actionCount.plus(BIGINT_ONE)
  optionFactory.factoryOwnershipTransferredCount = optionFactory.factoryOwnershipTransferredCount.plus(
    BIGINT_ONE,
  )
  optionFactory.save()

  let actionId =
    'OWNERSHIP-TRANFERRED-' +
    event.transaction.hash.toHex() +
    '-' +
    event.logIndex.toString()
  let action = new FactoryOwnershipTransferredAction(actionId)
  action.factory = OPTION_CONTRACT_STATE_KEY
  action.oldOwner = event.params.previousOwner
  action.newOwner = event.params.newOwner
  action.block = event.block.number
  action.transactionHash = event.transaction.hash
  action.timestamp = event.block.timestamp
  action.save()
}
