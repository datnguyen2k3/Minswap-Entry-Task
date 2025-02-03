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

export function getTradingPairTotal(datasource: DataSource) {
    const tradingPairRepository = datasource.getRepository(TradingPair)

    return tradingPairRepository.count();
}

export async function saveTradingPair(tokenTradeName1: string, tokenTradeName2: string, datasource: DataSource) {
    if (tokenTradeName1 === tokenTradeName2) {
        throw new Error('Token 2 must be different from token 1');
    }

    const token1 = await findTokenBySymbol(tokenTradeName1, datasource);
    const token2 = await findTokenBySymbol(tokenTradeName2, datasource);

    if (!token1 || !token2) {
        throw new Error('Token not found');
    }

    const tradingPair = new TradingPair();
    tradingPair.tokenTradeName1 = tokenTradeName1;
    tradingPair.tokenTradeName2 = tokenTradeName2;

    const tradingPairRepository = datasource.getRepository(TradingPair);
    return tradingPairRepository.save(tradingPair);
}
