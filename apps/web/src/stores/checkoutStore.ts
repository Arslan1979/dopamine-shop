import { create } from 'zustand';
import type { ShippingFormData, DeliveryFormData } from '../lib/validation/checkoutSchema';

interface CheckoutState {
  step: number;
  shippingData: ShippingFormData | null;
  deliveryData: DeliveryFormData | null;
  coinsToSpend: number;
  validationErrors: Record<string, string>;
  setStep: (step: number) => void;
  setShippingData: (data: ShippingFormData) => void;
  setDeliveryData: (data: DeliveryFormData) => void;
  setCoinsToSpend: (coins: number) => void;
  setValidationErrors: (errors: Record<string, string>) => void;
  clearCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  step: 1,
  shippingData: null,
  deliveryData: null,
  coinsToSpend: 0,
  validationErrors: {},
  setStep: (step) => set({ step }),
  setShippingData: (data) => set({ shippingData: data, validationErrors: {} }),
  setDeliveryData: (data) => set({ deliveryData: data, validationErrors: {} }),
  setCoinsToSpend: (coins) => set({ coinsToSpend: coins }),
  setValidationErrors: (errors) => set({ validationErrors: errors }),
  clearCheckout: () => set({ step: 1, shippingData: null, deliveryData: null, coinsToSpend: 0, validationErrors: {} }),
}));
