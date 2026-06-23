import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { billingApi } from '@/api/billingApi'

export const billingKeys = {
  all: ['billing'] as const,
  plans: () => [...billingKeys.all, 'plans'] as const,
  packages: () => [...billingKeys.all, 'credit-packages'] as const,
  workspace: (workspaceId: string) =>
    [...billingKeys.all, 'workspace', workspaceId] as const,
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

export function useWorkspaceBilling(workspaceId: string | undefined) {
  return useQuery({
    queryKey: billingKeys.workspace(workspaceId!),
    queryFn: () => billingApi.getWorkspaceBilling(workspaceId!),
    enabled: Boolean(workspaceId),
  })
}

export function useCreateBillingCheckout(workspaceId: string) {
  return useMutation({
    mutationFn: (productCode: string) =>
      billingApi.createCheckout(workspaceId, productCode),
    onError: (error: Error) => {
      toast.error(error.message || 'Unable to start payment')
    },
  })
}

export function useRefreshWorkspaceBilling(workspaceId: string | null) {
  const queryClient = useQueryClient()

  return () => {
    if (workspaceId) {
      queryClient.invalidateQueries({
        queryKey: billingKeys.workspace(workspaceId),
      })
    }
  }
}
