// src/modules/invoices/dto/create-invoice.dto.ts
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateInvoiceDto {
    @IsNotEmpty()
    @IsString()
    invoiceNumber: string;

    @IsNotEmpty()
    @IsString()
    invoiceDate: string;

    @IsNotEmpty()
    @IsString()
    invoiceTime: string;

    @IsNotEmpty()
    @IsNumber()
    invoiceTotal: number;

    @IsNotEmpty()
    @IsNumber()
    taxValue: number;

    @IsOptional()
    @IsNumber()
    otherTaxes?: number;

    @IsNotEmpty()
    @IsNumber()
    grandTotal: number;

    @IsNotEmpty()
    @IsString()
    supplierNIT: string;

    @IsNotEmpty()
    @IsString()
    supplierName: string;

    @IsNotEmpty()
    @IsString()
    customerID: string;

    @IsNotEmpty()
    @IsString()
    customerName: string;

    @IsNotEmpty()
    @IsString()
    customerType: string;

    @IsOptional()
    @IsBoolean()
    isTest?: boolean;
}