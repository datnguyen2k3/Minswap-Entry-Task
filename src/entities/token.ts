import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import {fromText} from "@lucid-evolution/lucid";

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
        return this.policyId + '.' + fromText(<string>this.tokenName);
    }
}
