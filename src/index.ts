export {
  handleOptionsContractCreated,
  handleAssetAdded,
  handleAssetChanged,
  handleAssetDeleted,
  handleOwnershipTransferred,
} from './OptionsFactory'

export {
  handleVaultOpened,
  handleETHCollateralAdded,
  handleERC20CollateralAdded,
  handleIssuedOTokens,
  handleLiquidate,
  handleExercise,
  handleRedeemVaultBalance,
  handleRemoveUnderlying,
  handleBurnOTokens,
  handleRemoveCollateral,
  handleOptionsContractOwnershipTransferred,
  handleUpdateParameters,
  handleTransferFee,
} from './OptionsContract'

export { handleSellOTokens, handleBuyOTokens } from './OptionsExchange'

export { handleERC20Transfer } from './ERC20'

export { handleApproval } from './Approval'
