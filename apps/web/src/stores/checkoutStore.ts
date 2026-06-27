import { create } from 'zustand';
import type { ShippingFormData, DeliveryFormData } from '../lib/validation/checkoutSchema';

interface CheckoutState {
  step: number;
  shippingData: ShippingFormData | null;
  deliveryData: DeliveryFormData | null;
  validationErrors: Record<string, string>;
  setStep: (step: number) => void;
  setShippingData: (data: ShippingFormData) => void;
  setDeliveryData: (data: DeliveryFormData) => void;
  setValidationErrors: (errors: Record<string, string>) => void;
  clearCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  step: 1,
  shippingData: null,
  deliveryData: null,
  validationErrors: {},
  setStep: (step) => set({ step }),
  setShippingData: (data) => set({ shippingData: data, validationErrors: {} }),
  setDeliveryData: (data) => set({ deliveryData: data, validationErrors: {} }),
  setValidationErrors: (errors) => set({ validationErrors: errors }),
  clearCheckout: () => set({ step: 1, shippingData: null, deliveryData: null, validationErrors: {} }),
}));
