import {DataSource} from "typeorm";
import {TradingPair} from "../entities/trading-pair";

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