import { log, store, Address } from '@graphprotocol/graph-ts'

import {
  OptionsContract as OptionsContractSmartContract,
  VaultOpened as VaultOpenedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Exercise as ExerciseEvent,
  ETHCollateralAdded as ETHCollateralAddedEvent,
  ERC20CollateralAdded as ERC20CollateralAddedEvent,
  RemoveCollateral as RemoveCollateralEvent,
  RemoveUnderlying as RemoveUnderlyingEvent,
  IssuedOTokens as IssuedOTokensEvent,
  Liquidate as LiquidateEvent,
  RedeemVaultBalance as RedeemVaultBalanceEvent,
  BurnOTokens as BurnOTokensEvent,
  UpdateParameters as UpdateParametersEvent,
  TransferFee as TransferFeeEvent,
} from '../generated/templates/OptionsContract/OptionsContract'

import { Oracle as OracleContract } from '../generated/templates/OptionsContract/Oracle'

import {
  OptionsContract,
  Vault,
  VaultOpenedAction,
  ExerciseAction,
  OptionsContractOwnershipTransferredAction,
  ETHCollateralAddedAction,
  ERC20CollateralAddedAction,
  RemoveCollateralAction,
  RemoveUnderlyingAction,
  IssuedOTokenAction,
  LiquidateAction,
  RedeemVaultBalanceAction,
  BurnOTokenAction,
  UpdateParametersAction,
  TransferFeeAction,
} from '../generated/schema'

import { BIGINT_ZERO, BIGINT_ONE } from './helpers'
import { ORACLE, USDC } from './constants'

// Option related events

export function handleVaultOpened(event: VaultOpenedEvent): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContract.load(optionsContractId)

  if (optionsContract != null) {
    let vaultId = optionsContractId + '-' + event.params.vaultOwner.toHexString()
    let vault = new Vault(vaultId)

    vault.owner = event.params.vaultOwner
    vault.optionsContract = optionsContractId
    vault.oTokensIssued = BIGINT_ZERO
    vault.collateral = BIGINT_ZERO
    vault.underlying = BIGINT_ZERO
    vault.actionCount = BIGINT_ZERO
    vault.exerciseCount = BIGINT_ZERO
    vault.ethCollateralAddedCount = BIGINT_ZERO
    vault.erc20CollateralAddedCount = BIGINT_ZERO
    vault.removeCollateralCount = BIGINT_ZERO
    vault.removeUnderlyingCount = BIGINT_ZERO
    vault.issuedOTokenCount = BIGINT_ZERO
    vault.liquidateCount = BIGINT_ZERO
    vault.redeemVaultBalanceActionCount = BIGINT_ZERO
    vault.burnOTokenCount = BIGINT_ZERO
    vault.save()

    let actionId =
      'VAULT-OPENED-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    let action = new VaultOpenedAction(actionId)
    action.optionsContract = optionsContractId
    action.owner = event.params.vaultOwner
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp
    action.save()

    optionsContract.actionCount = optionsContract.actionCount.plus(BIGINT_ONE)
    optionsContract.vaultOpenedCount = optionsContract.vaultOpenedCount.plus(BIGINT_ONE)
    optionsContract.save()
  } else {
    log.warning('handleVaultOpened: No OptionsContract with id {} found.', [
      optionsContractId,
    ])
  }
}

export function handleOptionsContractOwnershipTransferred(
  event: OwnershipTransferredEvent,
): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContract.load(optionsContractId)

  if (optionsContract != null) {
    optionsContract.owner = event.params.newOwner
    optionsContract.save()

    let actionId =
      'OWNERSHIP-TRANFERRED-' +
      event.transaction.hash.toHex() +
      '-' +
      event.logIndex.toString()
    let action = new OptionsContractOwnershipTransferredAction(actionId)
    action.optionsContract = optionsContractId
    action.oldOwner = event.params.previousOwner
    action.newOwner = event.params.newOwner
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp
    action.save()

    optionsContract.actionCount = optionsContract.actionCount.plus(BIGINT_ONE)
    optionsContract.optionsContractOwnershipTransferredCount = optionsContract.optionsContractOwnershipTransferredCount.plus(
      BIGINT_ONE,
    )
    optionsContract.save()
  } else {
    log.warning('handleOwnershipTransferred: No OptionsContract with id {} found.', [
      optionsContractId,
    ])
  }
}

export function handleUpdateParameters(event: UpdateParametersEvent): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContract.load(optionsContractId)

  if (optionsContract != null) {
    optionsContract.liquidationIncentiveValue = event.params.liquidationIncentive
    optionsContract.transactionFeeValue = event.params.transactionFee
    optionsContract.liquidationFactorValue = event.params.liquidationFactor
    optionsContract.minCollateralizationRatioValue =
      event.params.minCollateralizationRatio
    optionsContract.save()

    let actionId =
      'UPDATE-PARAMETERS-' +
      event.transaction.hash.toHex() +
      '-' +
      event.logIndex.toString()
    let action = new UpdateParametersAction(actionId)
    action.optionsContract = optionsContractId
    action.liquidationIncentive = event.params.liquidationIncentive
    action.transactionFee = event.params.transactionFee
    action.liquidationFactor = event.params.liquidationFactor
    action.minCollateralizationRatio = event.params.minCollateralizationRatio
    action.owner = event.params.owner
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp
    action.save()

    optionsContract.actionCount = optionsContract.actionCount.plus(BIGINT_ONE)
    optionsContract.updateParametersCount = optionsContract.updateParametersCount.plus(
      BIGINT_ONE,
    )
    optionsContract.save()
  } else {
    log.warning('handleUpdateParameters: No OptionsContract with id {} found.', [
      optionsContractId,
    ])
  }
}

export function handleTransferFee(event: TransferFeeEvent): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContract.load(optionsContractId)

  if (optionsContract != null) {
    optionsContract.totalCollateral = optionsContract.totalCollateral.minus(
      event.params.fees,
    )
    optionsContract.save()

    let actionId =
      'TRANSFER-FEE-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    let action = new TransferFeeAction(actionId)
    action.optionsContract = optionsContractId
    action.to = event.params.to
    action.fees = event.params.fees
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp
    action.save()

    optionsContract.actionCount = optionsContract.actionCount.plus(BIGINT_ONE)
    optionsContract.transferFeeCount = optionsContract.transferFeeCount.plus(BIGINT_ONE)
    optionsContract.save()
  } else {
    log.warning('handleTransferFee: No OptionsContract with id {} found.', [
      optionsContractId,
    ])
  }
}

// Vault related events

export function handleExercise(event: ExerciseEvent): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContract.load(optionsContractId)

  if (optionsContract != null) {
    optionsContract.totalExercised = optionsContract.totalExercised.plus(
      event.params.amtCollateralToPay,
    )
    optionsContract.totalUnderlying = optionsContract.totalUnderlying.plus(
      event.params.amtUnderlyingToPay,
    )
    optionsContract.save()

    let vaultId = optionsContractId + '-' + event.params.vaultExercisedFrom.toHexString()
    let vault = Vault.load(vaultId)
    if (vault != null) {
      let boundOptionsContract = OptionsContractSmartContract.bind(event.address)
      let vaultNew = boundOptionsContract.getVault(event.params.vaultExercisedFrom)

      let oTokensToExercise = vault.oTokensIssued.minus(vaultNew.value1)

      vault.collateral = vaultNew.value0
      vault.oTokensIssued = vaultNew.value1
      vault.underlying = vaultNew.value2
      vault.actionCount = vault.actionCount.plus(BIGINT_ONE)
      vault.exerciseCount = vault.exerciseCount.plus(BIGINT_ONE)
      vault.save()

      let actionId =
        'EXERCISE-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
      let action = new ExerciseAction(actionId)
      action.optionsContract = optionsContractId
      action.underlying = optionsContract.underlying
      action.vault = vaultId
      action.exerciser = event.params.exerciser
      action.vaultExercisedFrom = event.params.vaultExercisedFrom
      action.oTokensToExercise = oTokensToExercise
      action.amtUnderlyingToPay = event.params.amtUnderlyingToPay
      action.amtCollateralToPay = event.params.amtCollateralToPay
      action.block = event.block.number
      action.transactionHash = event.transaction.hash
      action.timestamp = event.block.timestamp

      let oracle = OracleContract.bind(Address.fromString(ORACLE))
      action.collateralPrice = oracle.getPrice(
        Address.fromString(optionsContract.collateral.toHexString()),
      )
      action.usdcPrice = oracle.getPrice(Address.fromString(USDC))

      action.save()
    } else {
      log.warning('handleExercise: No Vault with id {} found.', [vaultId])
    }
  } else {
    log.warning('handleExercise: No OptionsContract with id {} found.', [
      optionsContractId,
    ])
  }
}

export function handleETHCollateralAdded(event: ETHCollateralAddedEvent): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContract.load(optionsContractId)

  if (optionsContract != null) {
    // add totalCollateral
    optionsContract.totalCollateral = optionsContract.totalCollateral.plus(
      event.params.amount,
    )
    optionsContract.save()

    // add collateral to vault
    let vaultId = optionsContractId + '-' + event.params.vaultOwner.toHexString()
    let vault = Vault.load(vaultId)
    if (vault != null) {
      vault.collateral = vault.collateral.plus(event.params.amount)
      vault.save()

      let actionId =
        'ETH-COLLATERAL-ADDED-' +
        event.transaction.hash.toHex() +
        '-' +
        event.logIndex.toString()
      let action = new ETHCollateralAddedAction(actionId)
      action.vault = vaultId
      action.amount = event.params.amount
      action.payer = event.params.payer
      action.block = event.block.number
      action.transactionHash = event.transaction.hash
      action.timestamp = event.block.timestamp
      action.save()

      vault.actionCount = vault.actionCount.plus(BIGINT_ONE)
      vault.ethCollateralAddedCount = vault.ethCollateralAddedCount.plus(BIGINT_ONE)
      vault.save()
    } else {
      log.warning('handleETHCollateralAdded: No Vault with id {} found.', [vaultId])
    }
  } else {
    log.warning('handleETHCollateralAdded: No OptionsContract with id {} found.', [
      optionsContractId,
    ])
  }
}

export function handleERC20CollateralAdded(event: ERC20CollateralAddedEvent): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContract.load(optionsContractId)

  let actionId =
    'ERC20-COLLATERAL-ADDED-' +
    event.transaction.hash.toHex() +
    '-' +
    event.logIndex.toString()
  let actionCheck = ERC20CollateralAddedAction.load(actionId)
  if (actionCheck != null) {
    log.error(
      'handleERC20CollateralAdded: Trying to proccess same event tx {} block {}',
      [event.transaction.hash.toString(), event.block.number.toString()],
    )
    return
  }

  if (optionsContract != null) {
    // add totalCollateral
    optionsContract.totalCollateral = optionsContract.totalCollateral.plus(
      event.params.amount,
    )
    optionsContract.save()

    // add collateral to vault
    let vaultId = optionsContractId + '-' + event.params.vaultOwner.toHexString()
    let vault = Vault.load(vaultId)
    if (vault != null) {
      vault.collateral = vault.collateral.plus(event.params.amount)
      vault.save()

      let action = new ERC20CollateralAddedAction(actionId)
      action.vault = vaultId
      action.amount = event.params.amount
      action.payer = event.params.payer
      action.block = event.block.number
      action.transactionHash = event.transaction.hash
      action.timestamp = event.block.timestamp
      action.save()

      vault.actionCount = vault.actionCount.plus(BIGINT_ONE)
      vault.erc20CollateralAddedCount = vault.erc20CollateralAddedCount.plus(BIGINT_ONE)
      vault.save()
    } else {
      log.warning('handleERC20CollateralAdded: No Vault with id {} found.', [vaultId])
    }
  } else {
    log.warning('handleERC20CollateralAdded: No OptionsContract with id {} found.', [
      optionsContractId,
    ])
  }
}

export function handleRemoveCollateral(event: RemoveCollateralEvent): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContract.load(optionsContractId)

  if (optionsContract != null) {
    // add totalCollateral
    optionsContract.totalCollateral = optionsContract.totalCollateral.minus(
      event.params.amtRemoved,
    )
    optionsContract.save()

    // add collateral to vault
    let vaultId = optionsContractId + '-' + event.params.vaultOwner.toHexString()
    let vault = Vault.load(vaultId)
    if (vault != null) {
      vault.collateral = vault.collateral.minus(event.params.amtRemoved)
      vault.save()

      let actionId =
        'REMOVE-COLLATERAL-' +
        event.transaction.hash.toHex() +
        '-' +
        event.logIndex.toString()
      let action = new RemoveCollateralAction(actionId)
      action.vault = vaultId
      action.amount = event.params.amtRemoved
      action.owner = event.params.vaultOwner
      action.block = event.block.number
      action.transactionHash = event.transaction.hash
      action.timestamp = event.block.timestamp
      action.save()

      vault.actionCount = vault.actionCount.plus(BIGINT_ONE)
      vault.removeCollateralCount = vault.removeCollateralCount.plus(BIGINT_ONE)
      vault.save()
    } else {
      log.warning('handleRemoveCollateral: No Vault with id {} found.', [vaultId])
    }
  } else {
    log.warning('handleRemoveCollateral: No OptionsContract with id {} found.', [
      optionsContractId,
    ])
  }
}

export function handleRemoveUnderlying(event: RemoveUnderlyingEvent): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContract.load(optionsContractId)

  if (optionsContract != null) {
    optionsContract.totalUnderlying = optionsContract.totalUnderlying.minus(
      event.params.amountUnderlying,
    )
    optionsContract.save()

    let vaultId = optionsContractId + '-' + event.params.vaultOwner.toHexString()
    let vault = Vault.load(vaultId)
    if (vault != null) {
      vault.underlying = vault.underlying.minus(event.params.amountUnderlying)
      vault.save()

      let actionId =
        'REMOVE-UNDERLYING-' +
        event.transaction.hash.toHex() +
        '-' +
        event.logIndex.toString()
      let action = new RemoveUnderlyingAction(actionId)
      action.vault = vaultId
      action.amount = event.params.amountUnderlying
      action.owner = event.params.vaultOwner
      action.block = event.block.number
      action.transactionHash = event.transaction.hash
      action.timestamp = event.block.timestamp
      action.save()

      vault.actionCount = vault.actionCount.plus(BIGINT_ONE)
      vault.removeCollateralCount = vault.removeCollateralCount.plus(BIGINT_ONE)
      vault.save()
    } else {
      log.warning('handleRemoveUnderlying: No Vault with id {} found.', [vaultId])
    }
  } else {
    log.warning('handleRemoveUnderlying: No OptionsContract with id {} found.', [
      optionsContractId,
    ])
  }
}

export function handleIssuedOTokens(event: IssuedOTokensEvent): void {
  let optionsContractId = event.address.toHexString()

  let actionId =
    'ISSUED-OTOKENS-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  let actionCheck = IssuedOTokenAction.load(actionId)
  if (actionCheck != null) {
    log.error('handleIssuedOTokens: Trying to proccess same event tx {} block {}', [
      event.transaction.hash.toString(),
      event.block.number.toString(),
    ])
    return
  }

  // add putsOutstanding to vault
  let vaultId = optionsContractId + '-' + event.params.vaultOwner.toHexString()
  let vault = Vault.load(vaultId)
  if (vault != null) {
    vault.oTokensIssued = vault.oTokensIssued.plus(event.params.oTokensIssued)
    vault.save()

    let action = new IssuedOTokenAction(actionId)
    action.vault = vaultId
    action.amount = event.params.oTokensIssued
    action.issuedTo = event.params.issuedTo
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp
    action.save()

    vault.actionCount = vault.actionCount.plus(BIGINT_ONE)
    vault.issuedOTokenCount = vault.issuedOTokenCount.plus(BIGINT_ONE)
    vault.save()
  } else {
    log.warning('handleIssuedOTokens: No Vault with id {} found.', [vaultId])
  }
}

export function handleBurnOTokens(event: BurnOTokensEvent): void {
  let optionsContractId = event.address.toHexString()

  // remove putsOutstanding to vault
  let vaultId = optionsContractId + '-' + event.params.vaultOwner.toHexString()
  let vault = Vault.load(vaultId)
  if (vault != null) {
    vault.oTokensIssued = vault.oTokensIssued.minus(event.params.oTokensBurned)
    vault.save()

    let actionId =
      'BURN-OTOKENS-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    let action = new BurnOTokenAction(actionId)
    action.vault = vaultId
    action.burned = event.params.oTokensBurned
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp
    action.save()

    vault.actionCount = vault.actionCount.plus(BIGINT_ONE)
    vault.burnOTokenCount = vault.burnOTokenCount.plus(BIGINT_ONE)
    vault.save()
  } else {
    log.warning('handleBurnOTokens: No Vault with id {} found.', [vaultId])
  }
}

export function handleLiquidate(event: LiquidateEvent): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContract.load(optionsContractId)

  if (optionsContract != null) {
    // uptate totalLiquidated an totalCollateral
    optionsContract.totalCollateral = optionsContract.totalCollateral.minus(
      event.params.amtCollateralToPay,
    )
    optionsContract.totalLiquidated = optionsContract.totalLiquidated.plus(
      event.params.amtCollateralToPay,
    )
    optionsContract.save()

    // update collateral and oTokensIssued in vault
    let vaultId = optionsContractId + '-' + event.params.vaultOwner.toHexString()
    let vault = Vault.load(vaultId)
    if (vault != null) {
      let boundOptionsContract = OptionsContractSmartContract.bind(event.address)
      let vaultNew = boundOptionsContract.getVault(event.params.vaultOwner)

      let oTokensToLiquidate = vault.oTokensIssued.minus(vaultNew.value1)

      vault.collateral = vaultNew.value0
      vault.oTokensIssued = vaultNew.value1
      vault.actionCount = vault.actionCount.plus(BIGINT_ONE)
      vault.liquidateCount = vault.liquidateCount.plus(BIGINT_ONE)
      vault.save()

      let actionId =
        'LIQUIDATE-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
      let action = new LiquidateAction(actionId)
      action.vault = vaultId
      action.oTokensToLiquidate = oTokensToLiquidate
      action.collateralToPay = event.params.amtCollateralToPay
      action.liquidator = event.params.liquidator
      action.block = event.block.number
      action.transactionHash = event.transaction.hash
      action.timestamp = event.block.timestamp

      let oracle = OracleContract.bind(Address.fromString(ORACLE))
      action.collateralPrice = oracle.getPrice(
        Address.fromString(optionsContract.collateral.toHexString()),
      )
      action.usdcPrice = oracle.getPrice(Address.fromString(USDC))

      action.save()
    } else {
      log.warning('handleLiquidate: No Vault with id {} found.', [vaultId])
    }
  } else {
    log.warning('handleLiquidate: No OptionsContract with id {} found.', [
      optionsContractId,
    ])
  }
}

export function handleRedeemVaultBalance(event: RedeemVaultBalanceEvent): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContract.load(optionsContractId)

  if (optionsContract != null) {
    // uptate totalUnderlying an totalCollateral
    optionsContract.totalCollateral = optionsContract.totalCollateral.minus(
      event.params.amtCollateralRedeemed,
    )
    optionsContract.totalUnderlying = optionsContract.totalUnderlying.minus(
      event.params.amtUnderlyingRedeemed,
    )
    optionsContract.save()

    // update collateral and putsOutstanding in vault
    let vaultId = optionsContractId + '-' + event.params.vaultOwner.toHexString()
    let vault = Vault.load(vaultId)
    if (vault != null) {
      let optionsContract = OptionsContractSmartContract.bind(event.address)
      let vaultNew = optionsContract.getVault(event.params.vaultOwner)
      vault.collateral = vaultNew.value0
      vault.oTokensIssued = vaultNew.value1
      vault.underlying = vaultNew.value2
      vault.save()

      let actionId =
        'REDEEM-VAULT-BALANCE-' +
        event.transaction.hash.toHex() +
        '-' +
        event.logIndex.toString()
      let action = new RedeemVaultBalanceAction(actionId)
      action.vault = vaultId
      action.collateralRedeemed = event.params.amtCollateralRedeemed
      action.underlyingRedeemed = event.params.amtUnderlyingRedeemed
      action.redeemedBy = event.params.vaultOwner
      action.block = event.block.number
      action.transactionHash = event.transaction.hash
      action.timestamp = event.block.timestamp
      action.save()

      vault.actionCount = vault.actionCount.plus(BIGINT_ONE)
      vault.redeemVaultBalanceActionCount = vault.redeemVaultBalanceActionCount.plus(
        BIGINT_ONE,
      )
      vault.save()
    } else {
      log.warning('handleClaimedCollateral: No Vault with id {} found.', [vaultId])
    }
  } else {
    log.warning('handleClaimedCollateral: No OptionsContract with id {} found.', [
      optionsContractId,
    ])
  }
}
