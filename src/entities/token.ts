import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import {fromText} from "@lucid-evolution/lucid";
import {Asset} from "../../dex/src/types";

@Entity()
export class Token {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column({ type: 'varchar' })
    policyId: string | undefined;

    @Column({ type: 'varchar' })
    tokenName: string | undefined;

    @Column({ type: 'varchar' })
    tradeName: string | undefined;

    public getContractName(): string {
        return this.policyId + fromText(<string>this.tokenName);
    }

    public getAsset(): Asset {
        if (!this.policyId || !this.tokenName) {
            throw new Error('Token is not initialized');
        }

        return {
            policyId: this.policyId,
            tokenName: this.tokenName
        }
    }
}
