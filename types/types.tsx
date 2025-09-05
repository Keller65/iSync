export type Tier = {
  qty: number;
  price: number;
  percent: number;
  expiry: string
};

export type ProductDiscount = {
  itemCode: string;
  itemName: string;
  groupCode: number;
  groupName: string;
  inStock: number;
  committed: number;
  ordered: number;
  price: number;
  hasDiscount: boolean;
  barCode: string | null;
  salesUnit: string | null;
  salesItemsPerUnit: number;
  imageUrl: string | null;
  taxType: "EXE" | "INA";
  tiers: Tier[];
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  categoryCode: string; // Código de la categoría del producto
};

export type CreateOrder = {
  cardCode: string,
  docDate: string,
  docDueDate: string,
  comments: string,
  lines: [
    {
      itemCode: string,
      quantity: number,
      lineTotal: number,
      priceList: number,
      priceAfterVAT: number,
      taxCode: string,
    }
  ]
}

export interface Customer {
  cardCode: string;
  cardName: string;
  federalTaxID: string;
  priceListNum: string;
}

export interface CustomersResponse {
  items: Customer[];
  page: number;
  pageSize: number;
  total: number;
}

export interface OrderLineType {
  itemCode: string;
  itemDescription: string;
  barCode: string;
  quantity: number;
  priceAfterVAT: number;
  taxCode: string;
  lineTotal: number;
}

export interface OrderDataType {
  docEntry: number;
  docNum: number;
  cardCode: string;
  cardName: string;
  federalTaxID: string;
  address: string;
  docDate: string;
  vatSum: number;
  docTotal: number;
  comments: string;
  salesPersonCode: number;
  lines: OrderLineType[];
}

export interface PaymentData {
  docEntry: number;
  docNum: number;
  cardCode: string;
  cardName: string;
  docDate: string; // ISO date string
  total: number;
  paymentMeans: 'Tarjeta' | 'Efectivo' | 'Transferencia' | 'Cheque';
  cash: number;
  transfer: number;
  check: number;
  credit: number;
  cancelled: 'tYES' | 'tNo';
  payment: {
    transferDate: string | null;
    transferReference: string | null;
    transferAccountName: string;
    dueDate: string | null;
    checkNumber: string | null;
    bankCode: string | null;
    checkSum: number | null;
    cardVoucherNum: string | null;
    cardCreditSum: number;
  }[];
  invoices: {
    invoiceDocEntry: number;
    invoiceDocNum: number;
    appliedAmount: number;
    invoiceDate: string; // ISO date string
    numAtCard: string;
    docTotal: number;
    saldoAnterior: number;
    pendiente: number;
  }[];
}

export interface Invoice {
  docEntry: string;
  docDate: string;
  numAtCard: string;
  docTotal: number;
  balanceDue: number;
  docDueDate: string;
};

export interface Banks {
  bankCode: string;
  bankName: string;
}

export interface AccountPayTransderencia {
  code: string;
  name: string;
}

export interface AccountPayCheque {
  bankCode: string;
  bankName: string;
}

export interface AccountPayEfectivo {
  slpCode: string | number;
  CashAccount: string;
}

export interface AccountPayCreditCards {
  creditCardCode: string;
  creditCardName: string;
}

// POST de Cobros

export interface POSTPayment {
  cardCode: string;
  u_SlpCode: string,
  u_Latitud: string,
  u_Longitud: string,
  docDate: string,
  cashAccount: string,
  cashSum: number,
  checkAccount: string,
  transferAccount: string,
  transferSum: number,
  transferDate: string,
  transferReference: string,
  paymentChecks: [
    {
      dueDate: string
      checkNumber: number,
      countryCode: string,
      bankCode: string,
      checkSum: number
    }
  ],
  paymentInvoices: [
    {
      docEntry: number,
      sumApplied: number,
      BalanceDue: number
    }
  ],
  paymentCreditCards: [
    {
      creditCard: number,
      voucherNum: string,
      firstPaymentDue: string,
      creditSum: number
    }
  ]
}

export interface IncomingPayment {
  CardCode: string;
  U_SlpCode: string;
  u_Latitud?: string;
  U_Latitud?: string;
  u_Longitud?: string;
  U_Longitud?: string;
  DocDate: string;

  // Efectivo
  CashAccount?: string;
  CashSum?: number;

  // Cheque
  CheckAccount?: string;
  paymentChecks?: PaymentCheck[];

  // Transferencia
  TransferAccount?: string;
  TransferSum?: number;
  TransferDate?: string;
  TransferReference?: string;

  // Facturas asociadas
  paymentInvoices?: PaymentInvoice[];

  // Tarjeta
  paymentCreditCards?: PaymentCreditCard[];
}

export interface PaymentCheck {
  dueDate: string;
  checkNumber: number;
  CountryCode: string;
  bankCode: string;
  checkSum: number;
}

export interface PaymentInvoice {
  docEntry?: number;
  DocEntry?: number;
  sumApplied?: number;
  SumApplied?: number;
  BalanceDue: number;
}

export interface PaymentCreditCard {
  creditCard: number;
  voucherNum: string;
  firstPaymentDue: string;
  creditSum: number;
}

// Direcciones de cliente (respuesta de /api/Customers/{cardCode}/addresses)
export interface CustomerAddress {
  rowNum: number;
  addressName: string;
  addressType: string;
  bpCode: string;
  street: string;
  country: string;
  state: string;
  stateName: string;
  u_Ciudad: string;
  ciudadName: string;
  u_Latitud: string;
  u_Longitud: string;
}