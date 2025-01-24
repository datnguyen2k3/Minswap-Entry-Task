import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Token} from "./token";


@Entity()
export class TradingPair {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @ManyToOne(() => Token, token => token.id)
    @JoinColumn()
    token1: Token | undefined;

    @ManyToOne(() => Token, token => token.id)
    @JoinColumn()
    token2: Token | undefined;
}
