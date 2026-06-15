import { http } from './http'

export interface BillingPlanDto {
  code: string
  name: string
  description: string
  priceVnd: number
  billingPeriodMonths: number
  includedCredits: number
  maxMembers: number
  storageLimitBytes: number
}

export interface CreditPackageDto {
  code: string
  name: string
  priceVnd: number
  credits: number
}

export interface BillingSummaryDto {
  workspaceId: string
  plan: BillingPlanDto
  status: string
  recurringCreditsRemaining: number
  topUpCreditsRemaining: number
  totalCreditsRemaining: number
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

export interface CheckoutSessionDto {
  paymentOrderId: string
  providerOrderCode: number
  productCode: string
  amountVnd: number
  checkoutUrl: string
  expiresAt: string | null
}

export interface PaymentReturnResponseDto {
  status: string
  successful: boolean
  message: string
}

export const billingApi = {
  getPlans: () => http.get<BillingPlanDto[]>('/billing/plans'),

  getCreditPackages: () =>
    http.get<CreditPackageDto[]>('/billing/credit-packages'),

  getWorkspaceBilling: (workspaceId: string) =>
    http.get<BillingSummaryDto>(`/workspaces/${workspaceId}/billing`),

  createCheckout: (workspaceId: string, productCode: string) =>
    http.post<CheckoutSessionDto>(
      `/workspaces/${workspaceId}/billing/checkout`,
      { productCode },
    ),

  confirmVnPayReturn: (queryString: string) =>
    http.get<PaymentReturnResponseDto>(
      `/billing/vnpay/return${queryString ? `?${queryString}` : ''}`,
    ),
}
