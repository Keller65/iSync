export interface ConsignmentLine {
  itemCode: string;
  itemDescription: string;
  barCode: string;
  idWarehouse: number;
  warehouseName: string;
  quantity: number;
  priceAfterVAT: number;
  groupCode: string;
}

export interface Consignment {
  docEntry: number;
  docNum: number;
  idCurrency: number;
  currencyName: string;
  exchangeRate: number;
  cardCode: string;
  cardName: string;
  federalTaxID: string;
  address: string;
  docDate: string;
  vatSum: number;
  docTotal: number;
  comments: string;
  salesPersonCode: number;
  lines: ConsignmentLine[];
}