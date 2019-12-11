import { Address, log } from '@graphprotocol/graph-ts'

import { OptionsContract } from '../generated/templates/OptionsContract/OptionsContract'
import { OptionsContract as OptionsContractState } from '../generated/schema'
import {
  BIGINT_ZERO
} from './helpers'

export function handleRepoOpened(): void {}
export function handleETHCollateralAdded(): void {}
export function handleERC20CollateralAdded(): void {}
export function handleIssuedOTokens(): void {}
export function handleLiquidate(): void {}
export function handleExercise(): void {}
export function handleClaimedCollateral(): void {}
export function handleBurnOTokens(): void {}
export function handleTransferRepoOwnership(): void {}
export function handleRemoveCollateral(): void {}
