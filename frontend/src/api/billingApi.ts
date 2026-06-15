import { http } from './http'
import type {
  BillingPlanDto,
  BillingSummaryDto,
  CheckoutSessionDto,
  CreditPackageDto,
} from '@/types/api'

export const billingApi = {
  getPlans: () => http.get<BillingPlanDto[]>('/billing/plans'),

  getCreditPackages: () => http.get<CreditPackageDto[]>('/billing/credit-packages'),

  getWorkspaceBilling: (workspaceId: string) => {
    return http.get<BillingSummaryDto>(`/workspaces/${workspaceId}/billing`)
  },

  createCheckout: (workspaceId: string, productCode: string) => {
    return http.post<CheckoutSessionDto>(`/workspaces/${workspaceId}/billing/checkout`, {
      productCode,
    })
  },
}
