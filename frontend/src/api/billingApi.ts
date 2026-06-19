import { http } from './http'
import type {
  BillingPlanDto,
  BillingSummaryDto,
  CheckoutSessionDto,
  CreditPackageDto,
} from '@/types/api'

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

  confirmPayOsReturn: (queryString: string) =>
    http.get<PaymentReturnResponseDto>(
      `/billing/payos/return${queryString ? `?${queryString}` : ''}`,
    ),
}
