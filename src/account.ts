import { BigInt, BigDecimal, Bytes, EthereumEvent } from '@graphprotocol/graph-ts'

import { Account, AccountBalance, OptionsContract } from '../generated/schema'

import { BIGINT_ZERO } from './helpers'

export function getOrCreateAccount(accountAddress: Bytes): Account {
  let accountId = accountAddress.toHex()
  let existingAccount = Account.load(accountId)

  if (existingAccount != null) {
    return existingAccount as Account
  }

  let newAccount = new Account(accountId)
  newAccount.address = accountAddress

  return newAccount
}

function getOrCreateAccountBalance(
  account: Account,
  token: OptionsContract,
): AccountBalance {
  let balanceId = account.id + '-' + token.id
  let previousBalance = AccountBalance.load(balanceId)

  if (previousBalance != null) {
    return previousBalance as AccountBalance
  }

  let newBalance = new AccountBalance(balanceId)
  newBalance.account = account.id
  newBalance.token = token.id
  newBalance.amount = BIGINT_ZERO

  return newBalance
}

export function increaseAccountBalance(
  account: Account,
  token: OptionsContract,
  amount: BigInt,
): AccountBalance {
  let balance = getOrCreateAccountBalance(account, token)
  balance.amount = balance.amount.plus(amount)

  return balance
}

export function decreaseAccountBalance(
  account: Account,
  token: OptionsContract,
  amount: BigInt,
): AccountBalance {
  let balance = getOrCreateAccountBalance(account, token)
  balance.amount = balance.amount.minus(amount)

  return balance
}
