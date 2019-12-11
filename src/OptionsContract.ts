import { Address, log } from '@graphprotocol/graph-ts'

import {
  OptionsContract,
  RepoOpened,
  OwnershipTransferred,
  ETHCollateralAdded,
  ERC20CollateralAdded,
  RemoveCollateral
} from '../generated/templates/OptionsContract/OptionsContract'
import {
  OptionsContract as OptionsContractState,
  Repo,
  RepoOpened as RepoOpenedAction,
  Exercise,
  OptionsContractOwnershipTransferred
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

    let actionId = 'REPO-OPENED' + event.transaction.hash.toHex() + '-' + event.logIndex.toString()
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

export function handleExercise(): void {}

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
      // TODO - save repo action
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
      // TODO - save repo action
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
      // TODO - save repo action
    } else {
      log.warning('handleRemoveCollateral: No Repo with id {} found.', [repoId])
    }
  } else {
    log.warning('handleRemoveCollateral: No OptionsContract with id {} found.', [optionsContractId])
  }
}

export function handleIssuedOTokens(): void {}

export function handleBurnOTokens(): void {}

export function handleLiquidate(): void {}

export function handleClaimedCollateral(): void {}

export function handleTransferRepoOwnership(): void {}
