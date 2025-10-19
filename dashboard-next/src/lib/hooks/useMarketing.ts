// Custom React Query hooks for marketing campaigns
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type {
  Campaign,
  CampaignsListResponse,
  CampaignDetailsResponse,
  CampaignMessagesResponse,
} from '@/types';

// ============================================================================
// Query Keys
// ============================================================================

export const marketingKeys = {
  all: ['marketing'] as const,
  campaigns: () => [...marketingKeys.all, 'campaigns'] as const,
  campaign: (id: string) => [...marketingKeys.all, 'campaign', id] as const,
  campaignStats: (id: string) => [...marketingKeys.campaign(id), 'stats'] as const,
  campaignMessages: (id: string) => [...marketingKeys.campaign(id), 'messages'] as const,
};

// ============================================================================
// Campaigns List Hook
// ============================================================================

export function useCampaigns(
  options?: Omit<UseQueryOptions<CampaignsListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<CampaignsListResponse, Error>({
    queryKey: marketingKeys.campaigns(),
    queryFn: () => apiClient.getCampaigns(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    ...options,
  });
}

// ============================================================================
// Campaign Stats Hook
// ============================================================================

export function useCampaignStats(
  campaignId: string,
  options?: Omit<UseQueryOptions<CampaignDetailsResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<CampaignDetailsResponse, Error>({
    queryKey: marketingKeys.campaignStats(campaignId),
    queryFn: () => apiClient.getCampaignStats(campaignId),
    staleTime: 30000,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    enabled: !!campaignId,
    ...options,
  });
}

// ============================================================================
// Campaign Messages Hook
// ============================================================================

export function useCampaignMessages(
  campaignId: string,
  options?: Omit<UseQueryOptions<CampaignMessagesResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<CampaignMessagesResponse, Error>({
    queryKey: marketingKeys.campaignMessages(campaignId),
    queryFn: () => apiClient.getCampaignMessages(campaignId),
    staleTime: 30000,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    enabled: !!campaignId,
    ...options,
  });
}
