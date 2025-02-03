import { Token } from "../entities/token";
import {DataSource} from "typeorm";

export async function saveToken(policyId: string, tokenName: string, tradeName: string, datasource: DataSource) {
    const token = new Token();
    token.policyId = policyId;
    token.tokenName = tokenName;
    token.tradeName = tradeName;

    const tokenRepository = datasource.getRepository(Token);
    return tokenRepository.save(token);
}

export async function findTokenBySymbol(symbol: string, datasource: DataSource) {
    const tokenRepository = datasource.getRepository(Token);
    return tokenRepository.findOne({
        where: {
            tradeName: symbol
        }
    })
}

export async function findTokenByPolicyIdAndTokenName(policyId: string, tokenName: string, datasource: DataSource) {
    const tokenRepository = datasource.getRepository(Token);
    return tokenRepository.findOne({
        where: {
            policyId: policyId,
            tokenName: tokenName
        }
    })
}

export async function getTokens(datasource: DataSource, page: number, perPage: number) {
    const tokenRepository = datasource.getRepository(Token);

    return tokenRepository.find({
        skip: page * perPage,
        take: perPage
    })
}

export async function getTokenTotalPage(datasource: DataSource, perPage: number) {
    const tokenRepository = datasource.getRepository(Token);

    const total = await tokenRepository.count();
    return Math.ceil(total / perPage);
}