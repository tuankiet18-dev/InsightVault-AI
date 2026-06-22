import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { billingApi } from '@/api/billingApi'

export const billingKeys = {
  all: ['billing'] as const,
  plans: () => [...billingKeys.all, 'plans'] as const,
  packages: () => [...billingKeys.all, 'credit-packages'] as const,
  account: () =>
    [...billingKeys.all, 'account'] as const,
}

export function useBillingCatalog() {
  const plans = useQuery({
    queryKey: billingKeys.plans(),
    queryFn: billingApi.getPlans,
  })
  const creditPackages = useQuery({
    queryKey: billingKeys.packages(),
    queryFn: billingApi.getCreditPackages,
  })

  return { plans, creditPackages }
}

export function useAccountBilling() {
  return useQuery({
    queryKey: billingKeys.account(),
    queryFn: () => billingApi.getAccountBilling(),
  })
}

export function useCreateBillingCheckout() {
  return useMutation({
    mutationFn: (productCode: string) =>
      billingApi.createCheckout(productCode),
    onError: (error: Error) => {
      toast.error(error.message || 'Unable to start payment')
    },
  })
}

export function useRefreshAccountBilling() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({
      queryKey: billingKeys.account(),
    })
  }
}
