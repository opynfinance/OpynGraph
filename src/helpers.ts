import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export let BIGINT_ONE = BigInt.fromI32(1)
export let BIGINT_ZERO = BigInt.fromI32(0)
export let BIGDECIMAL_ZERO = BigDecimal.fromString('0')
export let BIGDECIMAL_ONE = BigDecimal.fromString('1')

let ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

import { FIRST_FACTORY_BLACK_LIST } from './constants'

export function isZeroAddress(value: Address): boolean {
  return value.toHex() == ZERO_ADDRESS
}

export function toDecimal(value: BigInt, decimals: u32): BigDecimal {
  let precision = BigInt.fromI32(10)
    .pow(<u8>decimals)
    .toBigDecimal()

  return value.divDecimal(precision)
}

export function isBlackListed(value: Address): boolean {
  return FIRST_FACTORY_BLACK_LIST.indexOf(value.toHex()) >= 0
}
