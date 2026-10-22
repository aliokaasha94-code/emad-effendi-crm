import { useState } from "react";
import confetti from "canvas-confetti";
import { Gift, Sparkles, Check, ArrowRight } from "lucide-react";
import { REWARD_CATALOG, getCustomerTier, getNextTier, type RewardCatalogItem } from "@/lib/rewards";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Customer } from "@/types/crm";

interface RewardRedemptionSectionProps {
  customer: Customer;
  onRedeemReward: (reward: RewardCatalogItem) => Promise<void>;
  redeeming: boolean;
}

export function RewardRedemptionSection({
  customer,
  onRedeemReward,
  redeeming,
}: RewardRedemptionSectionProps) {
  const { lang } = useLanguage();
  const { pushToast } = useToast();
  const [selectedReward, setSelectedReward] = useState<RewardCatalogItem | null>(null);

  const tier = getCustomerTier(customer);
  const nextTier = getNextTier(tier.id);
  const points = customer.loyalty_points || 0;

  // Rewards affordable by customer
  const availableRewards = REWARD_CATALOG.filter((r) => r.pointsCost <= points);

  const handleConfirmRedeem = async (reward: RewardCatalogItem) => {
    try {
      await onRedeemReward(reward);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#d4af37", "#f3ba2f", "#ffffff"],
      });
      pushToast({
        variant: "success",
        title: lang === "ar" ? "تم استبدال المكافأة بنجاح! 🎁" : "Reward Redeemed! 🎁",
        description:
          lang === "ar"
            ? `تم منح ${reward.nameAr} وخصم ${reward.pointsCost} نقطة من رصيد ${customer.full_name}.`
            : `Granted ${reward.nameEn} and deducted ${reward.pointsCost} points.`,
      });
      setSelectedReward(null);
    } catch {
      pushToast({
        variant: "error",
        title: lang === "ar" ? "تعذر الاستبدال" : "Redemption Failed",
        description: lang === "ar" ? "حدث خطأ أثناء خصم النقاط." : "Error processing reward.",
      });
    }
  };

  return (
    <div className="surface rounded-2xl p-4 border border-[#2a2f38] space-y-4">
      {/* Tier and Points Status Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[#20252b] pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5"
            style={{
              backgroundColor: tier.badgeBg,
              borderColor: tier.badgeBorder,
              color: tier.textColor,
            }}
          >
            <Sparkles size={13} />
            <span>{lang === "ar" ? tier.nameAr : tier.nameEn}</span>
          </div>

          <div className="text-xs text-neutral-300">
            {lang === "ar" ? "الرصيد المتاح" : "Points Balance"}:{" "}
            <span className="font-extrabold text-gold text-sm">{points}</span>{" "}
            {lang === "ar" ? "نقطة" : "pts"}
          </div>
        </div>

        {nextTier && (
          <div className="text-[11px] text-neutral-400">
            {lang === "ar" ? "باقي" : "Need"}{" "}
            <span className="font-bold text-neutral-200">
              {Math.max(0, nextTier.minPoints - points)}
            </span>{" "}
            {lang === "ar" ? `لترقية ${nextTier.nameAr}` : `for ${nextTier.nameEn}`}
          </div>
        )}
      </div>

      {/* Available Rewards */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Gift size={14} className="text-gold" />
            <span>{lang === "ar" ? "المكافآت المتاحة للاستبدال الآن" : "Available Rewards to Claim"}</span>
          </span>
          <span className="text-[11px] text-neutral-400">
            {availableRewards.length}{" "}
            {lang === "ar" ? "مكافأة جاهزة" : "rewards ready"}
          </span>
        </div>

        {availableRewards.length === 0 ? (
          <div className="text-xs text-neutral-400 p-3 rounded-xl bg-[#111417] border border-[#20242a] text-center">
            {lang === "ar"
              ? `يحتاج العميل إلى ${Math.max(0, 40 - points)} نقطة إضافية للوصول لأول مكافأة (إسبريسو / أمريكانو).`
              : `Customer needs ${Math.max(0, 40 - points)} more points for the first reward.`}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableRewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#12161a] border border-[#262c36] hover:border-gold/50 transition-all text-right"
              >
                <div>
                  <div className="text-xs font-bold text-white">
                    {lang === "ar" ? reward.nameAr : reward.nameEn}
                  </div>
                  <div className="text-[11px] text-gold font-semibold mt-0.5">
                    {reward.pointsCost} {lang === "ar" ? "نقطة" : "pts"}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  loading={redeeming && selectedReward?.id === reward.id}
                  onClick={() => {
                    setSelectedReward(reward);
                    handleConfirmRedeem(reward);
                  }}
                  className="text-xs py-1 px-3 h-8"
                >
                  <Gift size={13} className="ml-1" />
                  <span>{lang === "ar" ? "استبدال" : "Claim"}</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
