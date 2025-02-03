import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Token} from "./token";


@Entity()
export class TradingPair {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column({ type: 'varchar' })
    tokenTradeName1: string | undefined;

    @Column({ type: 'varchar' })
    tokenTradeName2: string | undefined;

    public getPairName(): string {
        return this.tokenTradeName1 + '-' + this.tokenTradeName2;
    }
}
