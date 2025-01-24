import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Token {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column({ type: 'varchar' })
    contractName: string | undefined;

    @Column({ type: 'varchar' })
    policyId: string | undefined;

    @Column({ type: 'varchar' })
    tokenName: string | undefined;

    @Column({ type: 'varchar' })
    tradeName: string | undefined;
}
