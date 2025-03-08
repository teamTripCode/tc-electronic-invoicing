// src/modules/invoices/invoice.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column()
  invoiceDate: string;

  @Column()
  invoiceTime: string;

  @Column('decimal', { precision: 18, scale: 2 })
  invoiceTotal: number;

  @Column('decimal', { precision: 18, scale: 2 })
  taxValue: number;

  @Column('decimal', { precision: 18, scale: 2, default: 0 })
  otherTaxes: number;

  @Column('decimal', { precision: 18, scale: 2 })
  grandTotal: number;

  @Column()
  supplierNIT: string;

  @Column()
  supplierName: string;

  @Column()
  customerID: string;

  @Column()
  customerName: string;

  @Column()
  customerType: string;

  @Column({ nullable: true })
  cufe: string;

  @Column({ nullable: true })
  qrCode: string;

  @Column({ nullable: true })
  documentXML: string;

  @Column({ nullable: true })
  signedXML: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({ nullable: true })
  dianResponse: string;

  @Column({ nullable: true })
  dianResponseDate: Date;

  @Column({ default: false })
  isTest: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

