import type { SupabaseClient } from "@supabase/supabase-js";

export const getRuleAcceptanceStatus = async (
  supabase: SupabaseClient,
  estateId: string
) => {
  const { data: members } = await supabase
    .from("estate_members")
    .select("user_id,status")
    .eq("estate_id", estateId)
    .eq("status", "active");

  const activeMemberIds = (members ?? [])
    .map((member) => member.user_id)
    .filter(Boolean) as string[];

  const { data: rules } = await supabase
    .from("estate_rules")
    .select("id")
    .eq("estate_id", estateId);

  const ruleIds = (rules ?? []).map((rule) => rule.id);

  const { data: acceptances } = ruleIds.length
    ? await supabase
        .from("estate_rule_acceptances")
        .select("estate_rule_id,user_id")
        .in("estate_rule_id", ruleIds)
    : { data: [] };

  const acceptanceMap = new Map<string, Set<string>>();
  (acceptances ?? []).forEach((acceptance) => {
    if (!acceptanceMap.has(acceptance.estate_rule_id)) {
      acceptanceMap.set(acceptance.estate_rule_id, new Set());
    }
    acceptanceMap.get(acceptance.estate_rule_id)?.add(acceptance.user_id);
  });

  const rulesAccepted =
    ruleIds.length > 0 &&
    activeMemberIds.length > 0 &&
    ruleIds.every((ruleId) => {
      const acceptedBy = acceptanceMap.get(ruleId) ?? new Set<string>();
      return activeMemberIds.every((memberId) => acceptedBy.has(memberId));
    });

  return {
    rulesCount: ruleIds.length,
    activeMembers: activeMemberIds.length,
    rulesAccepted,
  };
};
