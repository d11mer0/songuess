import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from './customBaseQuery';

export interface LiqPayCheckoutResponse {
    orderId: string;
    data: string;
    signature: string;
    checkoutUrl: string;
    amount: number;
    currency: string;
    description: string;
}

export interface SimulateResponse {
    success: boolean;
    orderId: string;
    amount: number;
    isPremium: boolean;
    message: string;
}

export const liqpayApi = createApi({
    reducerPath: 'liqpayApi',
    baseQuery: customBaseQuery,
    tagTypes: ['LiqPay', 'User'],
    endpoints: (builder) => ({
        createCheckout: builder.mutation<LiqPayCheckoutResponse, { amount: number; description?: string; type?: string }>({
            query: (body) => ({
                url: '/liqpay/checkout',
                method: 'POST',
                body,
            }),
        }),
        simulateTestDonation: builder.mutation<SimulateResponse, { amount: number; type?: string }>({
            query: (body) => ({
                url: '/liqpay/simulate-test',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['User'],
        }),
    }),
});

export const { useCreateCheckoutMutation, useSimulateTestDonationMutation } = liqpayApi;