import { log, store } from '@graphprotocol/graph-ts'

import {
  OptionsContract as OptionsContractSmartContract,
  VaultOpened as VaultOpenedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Exercise as ExerciseEvent,
  ETHCollateralAdded as ETHCollateralAddedEvent,
  ERC20CollateralAdded as ERC20CollateralAddedEvent,
  RemoveCollateral as RemoveCollateralEvent,
  IssuedOTokens as IssuedOTokensEvent,
  Liquidate as LiquidateEvent,
  ClaimedCollateral as ClaimedCollateralEvent,
  BurnOTokens as BurnOTokensEvent,
  UpdateParameters as UpdateParametersEvent,
  TransferFee as TransferFeeEvent,
  TransferVaultOwnership as TransferVaultOwnershipEvent,
} from '../generated/templates/OptionsContract/OptionsContract'

import {
  OptionsContract,
  Vault,
  VaultOpenedAction,
  ExerciseAction,
  OptionsContractOwnershipTransferredAction,
  ETHCollateralAddedAction,
  ERC20CollateralAddedAction,
  RemoveCollateralAction,
  IssuedOTokenAction,
  LiquidateAction,
  ClaimedCollateralAction,
  BurnOTokenAction,
  UpdateParametersAction,
  TransferFeeAction,
  TransferVaultOwnershipAction,
} from '../generated/schema'

import { BIGINT_ZERO, BIGINT_ONE } from './helpers'

// Option related events

export function handleVaultOpened(event: VaultOpenedEvent): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContract.load(optionsContractId)

  if (optionsContract !== null) {
    let vaultId = optionsContractId + '-' + event.params.vaultOwner.toHexString()
    let vault = new Vault(vaultId)

    vault.owner = event.params.vaultOwner
    vault.optionsContract = optionsContractId
    vault.oTokensIssued = BIGINT_ZERO
    vault.collateral = BIGINT_ZERO
    vault.actionCount = BIGINT_ZERO
    vault.ethCollateralAddedCount = BIGINT_ZERO
    vault.erc20CollateralAddedCount = BIGINT_ZERO
    vault.removeCollateralCount = BIGINT_ZERO
    vault.issuedOTokenCount = BIGINT_ZERO
    vault.liquidateCount = BIGINT_ZERO
    vault.claimedCollateralCount = BIGINT_ZERO
    vault.burnOTokenCount = BIGINT_ZERO
    vault.transferVaultOwnershipCount = BIGINT_ZERO
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

export function handleExercise(event: ExerciseEvent): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContract.load(optionsContractId)

  if (optionsContract !== null) {
    optionsContract.totalExercised = optionsContract.totalExercised.plus(
      event.params.amtCollateralToPay,
    )
    optionsContract.totalUnderlying = optionsContract.totalUnderlying.plus(
      event.params.amtUnderlyingToPay,
    )
    optionsContract.save()

    let actionId =
      'EXERCISE-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    let action = new ExerciseAction(actionId)
    action.optionsContract = optionsContractId
    action.exerciser = event.params.exerciser
    action.amtUnderlyingToPay = event.params.amtUnderlyingToPay
    action.amtCollateralToPay = event.params.amtCollateralToPay
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp
    action.save()

    optionsContract.actionCount = optionsContract.actionCount.plus(BIGINT_ONE)
    optionsContract.exerciseCount = optionsContract.exerciseCount.plus(BIGINT_ONE)
    optionsContract.save()
  } else {
    log.warning('handleExercise: No OptionsContract with id {} found.', [
      optionsContractId,
    ])
  }
}

export function handleOptionsContractOwnershipTransferred(
  event: OwnershipTransferredEvent,
): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContract.load(optionsContractId)

  if (optionsContract !== null) {
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

  if (optionsContract !== null) {
    optionsContract.liquidationIncentiveValue = event.params.liquidationIncentive
    optionsContract.transactionFeeValue = event.params.transactionFee
    optionsContract.liquidationFactorValue = event.params.liquidationFactor
    optionsContract.liquidationFeeValue = event.params.liquidationFee
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
    action.liquidationFee = event.params.liquidationFee
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

  if (optionsContract !== null) {
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

export function handleETHCollateralAdded(event: ETHCollateralAddedEvent): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContract.load(optionsContractId)

  if (optionsContract !== null) {
    // add totalCollateral
    optionsContract.totalCollateral = optionsContract.totalCollateral.plus(
      event.params.amount,
    )
    optionsContract.save()

    // add collateral to vault
    let vaultId = optionsContractId + '-' + event.params.vaultOwner.toHexString()
    let vault = Vault.load(vaultId)
    if (vault !== null) {
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

  if (optionsContract !== null) {
    // add totalCollateral
    optionsContract.totalCollateral = optionsContract.totalCollateral.plus(
      event.params.amount,
    )
    optionsContract.save()

    // add collateral to vault
    let vaultId = optionsContractId + '-' + event.params.vaultOwner.toHexString()
    let vault = Vault.load(vaultId)
    if (vault !== null) {
      vault.collateral = vault.collateral.plus(event.params.amount)
      vault.save()

      let actionId =
        'ERC20-COLLATERAL-ADDED-' +
        event.transaction.hash.toHex() +
        '-' +
        event.logIndex.toString()
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

  if (optionsContract !== null) {
    // add totalCollateral
    optionsContract.totalCollateral = optionsContract.totalCollateral.minus(
      event.params.amtRemoved,
    )
    optionsContract.save()

    // add collateral to vault
    let vaultId = optionsContractId + '-' + event.params.vaultOwner.toHexString()
    let vault = Vault.load(vaultId)
    if (vault !== null) {
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

export function handleIssuedOTokens(event: IssuedOTokensEvent): void {
  let optionsContractId = event.address.toHexString()

  // add putsOutstanding to vault
  let vaultId = optionsContractId + '-' + event.params.vaultOwner.toHexString()
  let vault = Vault.load(vaultId)
  if (vault !== null) {
    vault.oTokensIssued = vault.oTokensIssued.plus(event.params.oTokensIssued)
    vault.save()

    let actionId =
      'ISSUED-OTOKENS-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
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
  if (vault !== null) {
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

  if (optionsContract !== null) {
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
    if (vault !== null) {
      let optionsContract = OptionsContractSmartContract.bind(event.address)
      let vaultNew = optionsContract.getVault(event.params.vaultOwner)
      vault.collateral = vaultNew.value0
      vault.oTokensIssued = vaultNew.value1
      vault.save()

      let actionId =
        'LIQUIDATE-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
      let action = new LiquidateAction(actionId)
      action.vault = vaultId
      action.collateralToPay = event.params.amtCollateralToPay
      action.liquidator = event.params.liquidator
      action.block = event.block.number
      action.transactionHash = event.transaction.hash
      action.timestamp = event.block.timestamp
      action.save()

      vault.actionCount = vault.actionCount.plus(BIGINT_ONE)
      vault.liquidateCount = vault.liquidateCount.plus(BIGINT_ONE)
      vault.save()
    } else {
      log.warning('handleLiquidate: No Vault with id {} found.', [vaultId])
    }
  } else {
    log.warning('handleLiquidate: No OptionsContract with id {} found.', [
      optionsContractId,
    ])
  }
}

export function handleClaimedCollateral(event: ClaimedCollateralEvent): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContract.load(optionsContractId)

  if (optionsContract !== null) {
    // uptate totalUnderlying an totalCollateral
    optionsContract.totalCollateral = optionsContract.totalCollateral.minus(
      event.params.amtCollateralClaimed,
    )
    optionsContract.totalUnderlying = optionsContract.totalUnderlying.minus(
      event.params.amtUnderlyingClaimed,
    )
    optionsContract.save()

    // update collateral and putsOutstanding in vault
    let vaultId = optionsContractId + '-' + event.params.vaultOwner.toHexString()
    let vault = Vault.load(vaultId)
    if (vault !== null) {
      let optionsContract = OptionsContractSmartContract.bind(event.address)
      let vaultNew = optionsContract.getVault(event.params.vaultOwner)
      vault.collateral = vaultNew.value0
      vault.oTokensIssued = vaultNew.value1
      vault.save()

      let actionId =
        'CLAIMED-COLLATERAL-' +
        event.transaction.hash.toHex() +
        '-' +
        event.logIndex.toString()
      let action = new ClaimedCollateralAction(actionId)
      action.vault = vaultId
      action.collateralClaimed = event.params.amtCollateralClaimed
      action.underlyingClaimed = event.params.amtUnderlyingClaimed
      action.claimedBy = event.params.vaultOwner
      action.block = event.block.number
      action.transactionHash = event.transaction.hash
      action.timestamp = event.block.timestamp
      action.save()

      vault.actionCount = vault.actionCount.plus(BIGINT_ONE)
      vault.claimedCollateralCount = vault.claimedCollateralCount.plus(BIGINT_ONE)
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

export function handleTransferVaultOwnership(event: TransferVaultOwnershipEvent): void {
  let vaultId = event.address.toHexString() + '-' + event.params.oldOwner.toString()
  let vault = Vault.load(vaultId)

  if (vault !== null) {
    vault.owner = event.params.newOwner
    vault.save()

    let actionId =
      'OWNERSHIP-TRANFERRED-' +
      event.transaction.hash.toHex() +
      '-' +
      event.logIndex.toString()
    let action = new TransferVaultOwnershipAction(actionId)
    action.vault = vaultId
    action.oldOwner = event.params.oldOwner
    action.newOwner = event.params.newOwner
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp
    action.save()

    vault.actionCount = vault.actionCount.plus(BIGINT_ONE)
    vault.transferVaultOwnershipCount = vault.transferVaultOwnershipCount.plus(BIGINT_ONE)
    vault.save()
  } else {
    log.warning('handleTransferVaultOwnership: No Vault with id {} found.', [vaultId])
  }
}
