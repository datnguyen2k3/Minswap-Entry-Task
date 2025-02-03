import {DataSource} from "typeorm";
import {TradingPair} from "../entities/trading-pair";
import {findTokenBySymbol} from "./token-repository";

export function getTradingPairs(datasource: DataSource, page: number, perPage: number) {
    const tradingPairRepository = datasource.getRepository(TradingPair)

    return tradingPairRepository.find({
        skip: page * perPage,
        take: perPage
    })
}

export async function getTradingPairTotalPage(datasource: DataSource, perPage: number) {
    const tradingPairRepository = datasource.getRepository(TradingPair)

    const total = await tradingPairRepository.count();
    return Math.ceil(total / perPage);
}

export async function saveTradingPair(tokenTradeName1: string, tokenTradeName2: string, datasource: DataSource) {
    if (tokenTradeName1 === tokenTradeName2) {
        throw new Error('Token 2 must be different from token 1');
    }

    const token1 = await findTokenBySymbol(tokenTradeName1, datasource);
    const token2 = await findTokenBySymbol(tokenTradeName2, datasource);

    const tradingPair = new TradingPair();
    tradingPair.tokenTradeName1 = tokenTradeName1;
    tradingPair.tokenTradeName2 = tokenTradeName2;

    const tradingPairRepository = datasource.getRepository(TradingPair);

    if (token1 && tokenTradeName2 === 'ADA' || token2 && tokenTradeName1 === 'ADA' || token1 && token2) {
        return tradingPairRepository.save(tradingPair);
    }

    return null;
}

export async function addPair(tokenTradeName1: string, tokenTradeName2: string, datasource: DataSource) {
    await saveTradingPair(tokenTradeName1, tokenTradeName2, datasource);
    await saveTradingPair(tokenTradeName2, tokenTradeName1, datasource);
}

export async function findPairByTokenSymbol(tokenTradeName1: string, tokenTradeName2: string, datasource: DataSource) {
    const tradingPairRepository = datasource.getRepository(TradingPair);
    return tradingPairRepository.findOne({
        where: {
            tokenTradeName1: tokenTradeName1,
            tokenTradeName2: tokenTradeName2
        }
    })
}