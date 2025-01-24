import { Token } from "../entities/token";
import {DataSource} from "typeorm";

export async function createToken(datasource: DataSource, policyId: string, name: string) {
    const token = new Token();
    token.policyId = policyId;
    token.tokenName = name;

    const tokenRepository = datasource.getRepository(Token);
    return await tokenRepository.save(token);
}

export async function findTokenByTradeName(datasource: DataSource, tradeName: string) {
    const tokenRepository = datasource.getRepository(Token);
    return tokenRepository.findOne({
        where: {
            tradeName: tradeName
        }
    })
}