import { Address, log } from '@graphprotocol/graph-ts'

import {
  OptionsContract,
  RepoOpened,
  OwnershipTransferred,
  Exercise,
  ETHCollateralAdded,
  ERC20CollateralAdded,
  RemoveCollateral,
  IssuedOTokens,
  Liquidate,
  ClaimedCollateral,
  BurnOTokens,
  TransferRepoOwnership,
} from '../generated/templates/OptionsContract/OptionsContract'

import {
  OptionsContract as OptionsContractState,
  Repo,
  RepoOpened as RepoOpenedAction,
  Exercise as ExerciseAction,
  OptionsContractOwnershipTransferred,
  ETHCollateralAdded as ETHCollateralAddedAction,
  ERC20CollateralAdded as ERC20CollateralAddedAction,
  RemoveCollateral as RemoveCollateralAction,
  IssuedOToken as IssuedOTokensAction,
  Liquidate as LiquidateAction,
  ClaimedCollateral as ClaimedCollateralAction,
  BurnOToken as BurnOTokensAction,
  TransferRepoOwnership as TransferRepoOwnershipAction,
} from '../generated/schema'
import {
  BIGINT_ZERO
} from './helpers'

// options

export function handleRepoOpened(event: RepoOpened): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContractState.load(optionsContractId)

  if (optionsContract !== null) {
    let repoId = optionsContractId + '-' + event.params.repoIndex.toString()
    let repo = new Repo(repoId)
    repo.index = event.params.repoIndex
    repo.owner = event.params.repoOwner
    repo.optionsContract = optionsContractId
    repo.putsOutstanding = BIGINT_ZERO
    repo.collateral = BIGINT_ZERO
    repo.save()

    let actionId = 'REPO-OPENED-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    let action = new RepoOpenedAction(actionId)
    action.optionsContract = optionsContractId
    action.owner = event.params.repoOwner
    action.repoIndex = event.params.repoIndex
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp
    action.save()
  } else {
    log.warning('handleRepoOpened: No OptionsContract with id {} found.', [optionsContractId])
  }
}

export function handleExercise(event: Exercise): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContractState.load(optionsContractId)

  if (optionsContract !== null) {
    optionsContract.totalExercised = optionsContract.totalExercised.plus(event.params.amtCollateralToPay)
    optionsContract.totalUnderlying = optionsContract.totalUnderlying.plus(event.params.amtUnderlyingToPay)
    optionsContract.save()

    let actionId = 'EXERCISE-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    let action = new ExerciseAction(actionId)
    action.optionsContract = optionsContractId
    action.exerciser = event.params.exerciser
    action.amtUnderlyingToPay = event.params.amtUnderlyingToPay
    action.amtCollateralToPay = event.params.amtCollateralToPay
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp
    action.save()
  } else {
    log.warning('handleRepoOpened: No OptionsContract with id {} found.', [optionsContractId])
  }
}

export function handleOptionsContractOwnershipTransferred(event: OwnershipTransferred): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContractState.load(optionsContractId)

  if (optionsContract !== null) {
    optionsContract.owner = event.params.newOwner
    optionsContract.save()

    let actionId = 'OWNERSHIP-TRANFERRED-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    let action = new OptionsContractOwnershipTransferred(actionId)
    action.optionsContract = optionsContractId
    action.oldOwner = event.params.previousOwner
    action.newOwner = event.params.newOwner
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp
    action.save()
  } else {
    log.warning('handleOwnershipTransferred: No OptionsContract with id {} found.', [optionsContractId])
  }
}

// repo

export function handleETHCollateralAdded(event: ETHCollateralAdded): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContractState.load(optionsContractId)

  if (optionsContract !== null) {
    // add totalCollateral
    optionsContract.totalCollateral = optionsContract.totalCollateral.plus(event.params.amount)
    optionsContract.save()

    // add collateral to repo
    let repoId = optionsContractId + '-' + event.params.repoIndex.toString()
    let repo = Repo.load(repoId)
    if (repo !== null) {
      repo.collateral = repo.collateral.plus(event.params.amount)
      repo.save()

      let actionId = 'ETH-COLLATERAL-ADDED-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
      let action = new ETHCollateralAddedAction(actionId)
      action.repo = repoId
      action.amount = event.params.amount
      action.payer = event.params.payer
      action.block = event.block.number
      action.transactionHash = event.transaction.hash
      action.timestamp = event.block.timestamp
      action.save()
    } else {
      log.warning('handleETHCollateralAdded: No Repo with id {} found.', [repoId])
    }
  } else {
    log.warning('handleETHCollateralAdded: No OptionsContract with id {} found.', [optionsContractId])
  }
}

export function handleERC20CollateralAdded(event: ERC20CollateralAdded): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContractState.load(optionsContractId)

  if (optionsContract !== null) {
    // add totalCollateral
    optionsContract.totalCollateral = optionsContract.totalCollateral.plus(event.params.amount)
    optionsContract.save()

    // add collateral to repo
    let repoId = optionsContractId + '-' + event.params.repoIndex.toString()
    let repo = Repo.load(repoId)
    if (repo !== null) {
      repo.collateral = repo.collateral.plus(event.params.amount)
      repo.save()

      let actionId = 'ERC20-COLLATERAL-ADDED-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
      let action = new ERC20CollateralAddedAction(actionId)
      action.repo = repoId
      action.amount = event.params.amount
      action.payer = event.params.payer
      action.block = event.block.number
      action.transactionHash = event.transaction.hash
      action.timestamp = event.block.timestamp
      action.save()
    } else {
      log.warning('handleERC20CollateralAdded: No Repo with id {} found.', [repoId])
    }
  } else {
    log.warning('handleERC20CollateralAdded: No OptionsContract with id {} found.', [optionsContractId])
  }
}

export function handleRemoveCollateral(event: RemoveCollateral): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContractState.load(optionsContractId)

  if (optionsContract !== null) {
    // add totalCollateral
    optionsContract.totalCollateral = optionsContract.totalCollateral.minus(event.params.amtRemoved)
    optionsContract.save()

    // add collateral to repo
    let repoId = optionsContractId + '-' + event.params.repoIndex.toString()
    let repo = Repo.load(repoId)
    if (repo !== null) {
      repo.collateral = repo.collateral.minus(event.params.amtRemoved)
      repo.save()

      let actionId = 'REMOVE-COLLATERAL-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
      let action = new RemoveCollateralAction(actionId)
      action.repo = repoId
      action.amount = event.params.amtRemoved
      action.owner = event.params.repoOwner
      action.block = event.block.number
      action.transactionHash = event.transaction.hash
      action.timestamp = event.block.timestamp
      action.save()
    } else {
      log.warning('handleRemoveCollateral: No Repo with id {} found.', [repoId])
    }
  } else {
    log.warning('handleRemoveCollateral: No OptionsContract with id {} found.', [optionsContractId])
  }
}

export function handleIssuedOTokens(event:  IssuedOTokens): void {
  let optionsContractId = event.address.toHexString()

  // add putsOutstanding to repo
  let repoId = optionsContractId + '-' + event.params.repoIndex.toString()
  let repo = Repo.load(repoId)
  if (repo !== null) {
    repo.putsOutstanding = repo.putsOutstanding.plus(event.params.oTokensIssued)
    repo.save()

    let actionId = 'ISSUED-OTOKENS-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    let action = new IssuedOTokensAction(actionId)
    action.repo = repoId
    action.amount = event.params.oTokensIssued
    action.issuedTo = event.params.issuedTo
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp
    action.save()
  } else {
    log.warning('handleIssuedOTokens: No Repo with id {} found.', [repoId])
  }
}

export function handleBurnOTokens(event: BurnOTokens): void {
  let optionsContractId = event.address.toHexString()

  // remove putsOutstanding to repo
  let repoId = optionsContractId + '-' + event.params.repoIndex.toString()
  let repo = Repo.load(repoId)
  if (repo !== null) {
    repo.putsOutstanding = repo.putsOutstanding.minus(event.params.oTokensBurned)
    repo.save()

    let actionId = 'BURN-OTOKENS-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    let action = new BurnOTokensAction(actionId)
    action.repo = repoId
    action.burned = event.params.oTokensBurned
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp
    action.save()
  } else {
    log.warning('handleBurnOTokens: No Repo with id {} found.', [repoId])
  }
}

export function handleLiquidate(event: Liquidate): void {
  let optionsContractId = event.address.toHexString()
  let optionsContract = OptionsContractState.load(optionsContractId)
  if (optionsContract !== null) {
    // uptate totalLiquidated an totalCollateral
    optionsContract.totalCollateral = optionsContract.totalCollateral.minus(event.params.amtCollateralToPay)
    optionsContract.totalLiquidated = optionsContract.totalLiquidated.plus(event.params.amtCollateralToPay)
    optionsContract.save()

    // update collateral and putsOutstanding in repo
    let repoId = optionsContractId + '-' + event.params.repoIndex.toString()
    let repo = Repo.load(repoId)
    if (repo !== null) {
      let optionsContract = OptionsContract.bind(event.address)
      let repoNewState = optionsContract.repos(event.params.repoIndex)
      repo.collateral = repoNewState.value0
      repo.putsOutstanding = repoNewState.value1
      repo.save()

      let actionId = 'LIQUIDATE-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
      let action = new LiquidateAction(actionId)
      action.repo = repoId
      action.collateralToPay = event.params.amtCollateralToPay
      action.liquidator = event.params.liquidator
      action.block = event.block.number
      action.transactionHash = event.transaction.hash
      action.timestamp = event.block.timestamp
      action.save()
    } else {
      log.warning('handleLiquidate: No Repo with id {} found.', [repoId])
    }
  } else {
    log.warning('handleLiquidate: No OptionsContract with id {} found.', [optionsContractId])
  }
}

export function handleClaimedCollateral(): void {}

export function handleTransferRepoOwnership(event: TransferRepoOwnership): void {
  let repoId = event.address.toHexString() + '-' + event.params.repoIndex.toString()
  let repo = Repo.load(repoId)

  if (repo !== null) {
    repo.owner = event.params.newOwner
    repo.save()

    let actionId = 'OWNERSHIP-TRANFERRED-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    let action = new TransferRepoOwnershipAction(actionId)
    action.repo = repoId
    action.oldOwner = event.params.oldOwner
    action.newOwner = event.params.newOwner
    action.block = event.block.number
    action.transactionHash = event.transaction.hash
    action.timestamp = event.block.timestamp
    action.save()
  } else {
    log.warning('handleTransferRepoOwnership: No Repo with id {} found.', [repoId])
  }
}
