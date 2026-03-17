import axios from 'axios';

export interface OrderDetailsResponse {
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
  priceListNum: number | string;
  lines: {
    itemCode: string;
    itemDescription: string;
    barCode: string;
    quantity: number;
    priceAfterVAT: number;
    taxCode: string;
  }[];
}

export const fetchOrderDetails = async (
  docEntry: number,
  fetchUrl: string,
  token: string
): Promise<OrderDetailsResponse> => {
  try {
    const response = await axios.get<OrderDetailsResponse>(
      `/api/Documentos/${docEntry}`,
      {
        baseURL: fetchUrl,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log('Fetched order details for edit:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching order details for edit:', error);
    throw error;
  }
};