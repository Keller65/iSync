import { Customer, Invoice, ProductDiscount } from '@/types/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type CartItem = ProductDiscount & {
  quantity: number;
  unitPrice: number;
  total: number;
  tiers?: {
    qty: number;
    price: number;
    percent: number;
    expiry: string;
  }[];
};

// Customer importado desde types

export interface SelectedInvoice extends Invoice {
  paidAmount: number;
}

interface AppStoreState {
  // Flag bienvenida aceptada
  userClickAcceptWelcome: boolean;
  setUserClickAcceptWelcome: (value: boolean) => void;
  // Estado NO persistente para datos del formulario de pago
  paymentForm: {
    method: string | null;
    amount: string;
    reference: string;
    date: Date;
    bank: string;
    bankName: string;
  };
  setPaymentForm: (form: Partial<{
    method: string | null;
    amount: string;
    reference: string;
    date: Date;
    bank: string;
    bankName: string;
  }>) => void;
  savePaymentForm: () => void;
  clearPaymentForm: () => void;
  // Estado NO persistente: cliente seleccionado para módulo de facturas (igual a selectedCustomer pero independiente)
  selectedCustomerInvoices: Customer | null;
  setSelectedCustomerInvoices: (customer: Customer | null) => void;
  clearSelectedCustomerInvoices: () => void;
  products: CartItem[];
  addProduct: (productToAdd: Omit<CartItem, 'total'>) => void;
  updateQuantity: (itemCode: string, quantity: number, newPrice?: number) => void;
  removeProduct: (itemCode: string) => void;
  clearCart: () => void;

  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer) => void;
  clearSelectedCustomer: () => void;

  // Ubicación seleccionada (no persistente)
  selectedCustomerLocation: Customer | null;
  setSelectedCustomerLocation: (customer: Customer | null) => void;
  clearSelectedCustomerLocation: () => void;

  allProductsCache: ProductDiscount[];
  setAllProductsCache: (products: ProductDiscount[]) => void;
  clearAllProductsCache: () => void;

  rawSearchText: string;
  debouncedSearchText: string;
  setRawSearchText: (text: string) => void;
  setDebouncedSearchText: (text: string) => void;

  lastOrderDocEntry: number | null;
  setLastOrderDocEntry: (docEntry: number) => void;
  clearLastOrderDocEntry: () => void;

  appHost: string;
  appPort: string;
  fetchUrl: string;
  setAppHost: (host: string) => void;
  setAppPort: (port: string) => void;
  updateFetchUrl: () => void;
  clearAppConnection: () => void;

  selectedInvoices: SelectedInvoice[];
  addInvoice: (invoice: Invoice, paidAmount: number) => void;
  removeInvoice: (invoiceId: string) => void;
  clearInvoices: () => void;

  // Estado NO persistente para actualizar la ubicación del cliente
  updateCustomerLocation: {
    updateLocation: boolean;
    latitude: number | null;
    longitude: number | null;
    addressName: string | null;
    rowNum: number | null;
  };
  setUpdateCustomerLocation: (location: Partial<{
    updateLocation: boolean;
    latitude: number | null;
    longitude: number | null;
    addressName: string | null;
    rowNum: number | null;
  }>) => void;
  clearUpdateCustomerLocation: () => void;
}

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      products: [],
      selectedCustomer: null,
      selectedCustomerLocation: null,
      allProductsCache: [],
      rawSearchText: '',
      debouncedSearchText: '',
      lastOrderDocEntry: null,
      appHost: '',
      appPort: '',
      fetchUrl: '',
      selectedInvoices: [],
      selectedCustomerInvoices: null,
      userClickAcceptWelcome: false,
      setUserClickAcceptWelcome: (value: boolean) => set({ userClickAcceptWelcome: value }),
      // Estado NO persistente para datos del formulario de pago
      paymentForm: {
        method: null,
        amount: '',
        reference: '',
        date: new Date(),
        bank: '',
        bankName: '',
      },
      setSelectedCustomerInvoices: (customer) => set({ selectedCustomerInvoices: customer }),
      clearSelectedCustomerInvoices: () => set({ selectedCustomerInvoices: null }),
      setPaymentForm: (form) => {
        set((state) => ({
          paymentForm: {
            ...state.paymentForm,
            ...form,
          },
        }));
      },
      savePaymentForm: () => {
        const { paymentForm } = get();
        console.log('Datos del formulario de pago:', paymentForm);
      },
      clearPaymentForm: () => {
        set({
          paymentForm: {
            method: null,
            amount: '',
            reference: '',
            date: new Date(),
            bank: '',
            bankName: '',
          }
        });
      },

      addProduct: (productToAdd) => {
        const products = get().products;
        const existingIndex = products.findIndex(p => p.itemCode === productToAdd.itemCode);
        const updatedProducts = [...products];
        const newQuantity = productToAdd.quantity;
        const unitPrice = productToAdd.unitPrice;
        const newTotal = unitPrice * newQuantity;

        if (newQuantity <= 0) {
          if (existingIndex > -1) {
            updatedProducts.splice(existingIndex, 1);
          }
        } else if (existingIndex > -1) {
          updatedProducts[existingIndex] = {
            ...products[existingIndex],
            ...productToAdd,
            quantity: newQuantity,
            unitPrice: unitPrice,
            total: newTotal,
          };
        } else {
          updatedProducts.push({
            ...productToAdd,
            quantity: newQuantity,
            unitPrice: unitPrice,
            total: newTotal,
          });
        }
        set({ products: updatedProducts });
      },

      updateQuantity: (itemCode, quantity, newPrice) => {
        const products = get().products;
        const index = products.findIndex(p => p.itemCode === itemCode);
        if (index > -1) {
          if (quantity <= 0) {
            const updated = products.filter(p => p.itemCode !== itemCode);
            set({ products: updated });
          } else {
            const product = products[index];
            const actualUnitPrice = newPrice !== undefined ? newPrice : product.unitPrice;
            const total = actualUnitPrice * quantity;
            const updatedProducts = [...products];
            updatedProducts[index] = {
              ...product,
              quantity,
              unitPrice: actualUnitPrice,
              total,
            };
            set({ products: updatedProducts });
          }
        }
      },

      removeProduct: (itemCode) => {
        const updated = get().products.filter(p => p.itemCode !== itemCode);
        set({ products: updated });
      },

      clearCart: () => set({ products: [] }),

      setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
      clearSelectedCustomer: () => set({ selectedCustomer: null, selectedCustomerInvoices: null }),

      setSelectedCustomerLocation: (loc) => set({ selectedCustomerLocation: loc }),
      clearSelectedCustomerLocation: () => set({ selectedCustomerLocation: null }),

      setAllProductsCache: (products) => set({ allProductsCache: products }),
      clearAllProductsCache: () => set({ allProductsCache: [] }),

      setRawSearchText: (text) => set({ rawSearchText: text }),
      setDebouncedSearchText: (text) => set({ debouncedSearchText: text }),

      setLastOrderDocEntry: (docEntry: number) => set({ lastOrderDocEntry: docEntry }),
      clearLastOrderDocEntry: () => set({ lastOrderDocEntry: null }),

      setAppHost: (host) => {
        set({ appHost: host });
        get().updateFetchUrl();
      },
      setAppPort: (port) => {
        set({ appPort: port });
        get().updateFetchUrl();
      },
      updateFetchUrl: () => {
        const { appHost, appPort } = get();
        const url = `${appHost}${appPort ? `:${appPort}` : ''}`;
        set({ fetchUrl: url });
      },
      clearAppConnection: () => {
        set({ appHost: '', appPort: '', fetchUrl: '' });
      },

      addInvoice: (invoice, paidAmount) => {
        const invoices = get().selectedInvoices;
        const existingInvoiceIndex = invoices.findIndex(inv => inv.numAtCard === invoice.numAtCard);

        const newSelectedInvoice = {
          ...invoice,
          paidAmount,
        };

        let updatedInvoices = [...invoices];

        if (existingInvoiceIndex > -1) {
          updatedInvoices[existingInvoiceIndex] = newSelectedInvoice;
        } else {
          updatedInvoices.push(newSelectedInvoice);
        }

        set({ selectedInvoices: updatedInvoices });
      },

      removeInvoice: (invoiceId) => {
        set((state) => ({
          selectedInvoices: state.selectedInvoices.filter(inv => inv.numAtCard !== invoiceId),
        }));
      },

      clearInvoices: () => set({ selectedInvoices: [] }),

      // Estado NO persistente para actualizar la ubicación del cliente
      updateCustomerLocation: {
        updateLocation: false,
        latitude: null,
        longitude: null,
        addressName: null,
        rowNum: null,
      },
      setUpdateCustomerLocation: (location) => {
        set({ updateCustomerLocation: { ...get().updateCustomerLocation, ...location } });
      },
      clearUpdateCustomerLocation: () => {
        set({ updateCustomerLocation: { updateLocation: false, latitude: null, longitude: null, addressName: null, rowNum: null } });
      },
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        // Excluir estados NO persistentes
        const { selectedInvoices, selectedCustomerInvoices, paymentForm, selectedCustomerLocation, updateCustomerLocation, ...rest } = state;
        return rest;
      },
    }
  )
);