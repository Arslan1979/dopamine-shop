import { z } from 'zod';

export const shippingSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(50, 'Максимум 50 символов'),
  address: z.string().min(5, 'Минимум 5 символов').max(200, 'Максимум 200 символов'),
  city: z.string().min(2, 'Минимум 2 символа').max(50, 'Максимум 50 символов'),
  postalCode: z.string().regex(/^\d{6}$/, '6 цифр'),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, '10–15 цифр, можно с +'),
});

export const deliverySchema = z.object({
  method: z.enum(['standard', 'express', 'superfast']),
});

export type ShippingFormData = z.infer<typeof shippingSchema>;
export type DeliveryFormData = z.infer<typeof deliverySchema>;

export interface CheckoutData {
  shipping: ShippingFormData;
  delivery: DeliveryFormData;
}
