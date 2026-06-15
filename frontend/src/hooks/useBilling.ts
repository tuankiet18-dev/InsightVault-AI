import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { billingApi } from '@/api/billingApi'

export const billingKeys = {
  all: ['billing'] as const,
  plans: () => [...billingKeys.all, 'plans'] as const,
  creditPackages: () => [...billingKeys.all, 'credit-packages'] as const,
  workspace: (workspaceId: string | null) => [...billingKeys.all, 'workspace', workspaceId] as const,
}

export const useBillingPlans = () => {
  return useQuery({
    queryKey: billingKeys.plans(),
    queryFn: billingApi.getPlans,
  })
}

export const useCreditPackages = () => {
  return useQuery({
    queryKey: billingKeys.creditPackages(),
    queryFn: billingApi.getCreditPackages,
  })
}

export const useWorkspaceBilling = (workspaceId: string | null) => {
  return useQuery({
    queryKey: billingKeys.workspace(workspaceId),
    queryFn: () => billingApi.getWorkspaceBilling(workspaceId!),
    enabled: !!workspaceId,
  })
}

export const useCreateBillingCheckout = (workspaceId: string | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productCode: string) => billingApi.createCheckout(workspaceId!, productCode),
    onSuccess: (checkout) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.workspace(workspaceId) })
      window.location.assign(checkout.checkoutUrl)
    },
    onError: () => {
      toast.error('Could not start checkout')
    },
  })
}
