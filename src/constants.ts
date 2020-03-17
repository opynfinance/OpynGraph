export const ETH = '0x0000000000000000000000000000000000000000'
export const DAI = '0x6b175474e89094c44da98b954eedeac495271d0f'
export const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
export const OPTIONS_EXCHANGE = '0x5778f2824a114f6115dc74d432685d3336216017'
export const OPTIONS_EXCHANGE_V2 = '0x39246c4f3f6592c974ebc44f80ba6dc69b817c71'
export const OPTIONS_FACTORY = '0xb529964f86fbf99a6aa67f72a27e59fa3fa4feac'
export const OPTIONS_FACTORY_V2 = '0xcc5d905b9c2c8c9329eb4e25dc086369d6c7777c'
export const ORACLE = '0x7054e08461e3ecb7718b63540addb3c3a1746415'

let firstFactoryBlackList = new Array<string>()
firstFactoryBlackList.push('0x53bc874dcec311c230e28038e1ac8a6c3a28de61') // second ocDAI
firstFactoryBlackList.push('0x809ee624ad558cff769e6077088eb3dc2357aaea') // second oETH
firstFactoryBlackList.push('0x1bc76312a8549204b23c19ad82bab8079c64c265') // firs oETH

export let FIRST_FACTORY_BLACK_LIST = firstFactoryBlackList
