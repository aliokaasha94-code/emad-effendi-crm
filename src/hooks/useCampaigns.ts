import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requireSupabase } from "@/lib/supabase";
import type { Campaign, CampaignInput, CampaignUpdate } from "@/types/crm";

const CAMPAIGNS_ERROR = "تعذر تحميل الحملات. حاول مرة أخرى.";
const SAVE_CAMPAIGN_ERROR = "تعذر حفظ الحملة. حاول مرة أخرى.";

export interface CampaignUpdateVariables {
  id: string;
  input: CampaignUpdate;
}

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    staleTime: 30_000,
    queryFn: async (): Promise<Campaign[]> => {
      const client = requireSupabase();
      const { data, error } = await client
        .from("marketing_campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        throw new Error(CAMPAIGNS_ERROR);
      }

      return (data ?? []) as Campaign[];
    },
  });
}

export function useCampaignMutations() {
  const queryClient = useQueryClient();

  const createCampaign = useMutation({
    mutationFn: async (input: CampaignInput): Promise<Campaign> => {
      const client = requireSupabase();
      const { data, error } = await client
        .from("marketing_campaigns")
        .insert({
          title: input.title.trim(),
          target_segment: input.target_segment,
          message_template: input.message_template,
          discount_code: input.discount_code?.trim() || null,
          recipients_count: input.recipients_count,
        })
        .select("*")
        .single();

      if (error) {
        throw new Error(SAVE_CAMPAIGN_ERROR);
      }

      return data as Campaign;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
  });

  const updateCampaign = useMutation({
    mutationFn: async ({
      id,
      input,
    }: CampaignUpdateVariables): Promise<Campaign> => {
      const client = requireSupabase();
      const { data, error } = await client
        .from("marketing_campaigns")
        .update(input)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        throw new Error(SAVE_CAMPAIGN_ERROR);
      }

      return data as Campaign;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
  });

  return { createCampaign, updateCampaign };
}
