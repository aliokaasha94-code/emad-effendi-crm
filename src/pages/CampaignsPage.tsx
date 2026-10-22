import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ExternalLink, Megaphone, Plus, RefreshCw, Send, Users, Sparkles, MessageCircle } from "lucide-react";
import { useCampaigns, useCampaignMutations } from "@/hooks/useCampaigns";
import { useSegmentRecipients } from "@/hooks/useCustomers";
import type { SegmentRecipient } from "@/hooks/useCustomers";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  SegmentBadge,
  Skeleton,
  StatCard,
} from "@/components/ui/Misc";
import { PageHeader } from "@/components/layout/PageHeader";
import { buildWhatsAppLink, personalizeMessage } from "@/lib/whatsapp";
import { SEGMENT_ORDER, getSegmentMeta } from "@/lib/segments";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Campaign, CampaignInput, CustomerSegment } from "@/types/crm";

export function CampaignsPage() {
  const { t } = useLanguage();
  const [targetSegment, setTargetSegment] = useState<CustomerSegment>("VIP_CHAMPION");
  const [title, setTitle] = useState("");
  const [discountCode, setDiscountCode] = useState("EMAD15");
  const [messageTemplate, setMessageTemplate] = useState(
    getSegmentMeta("VIP_CHAMPION").template,
  );
  const [isTitleEdited, setIsTitleEdited] = useState(false);
  const [isDiscountEdited, setIsDiscountEdited] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: recipients = [], isLoading: recipientsLoading } =
    useSegmentRecipients(targetSegment);
  const {
    data: campaigns = [],
    isLoading: campaignsLoading,
    isError,
    refetch,
  } = useCampaigns();
  const { createCampaign, updateCampaign } = useCampaignMutations();
  const { pushToast } = useToast();

  useEffect(() => {
    if (!isTitleEdited) {
      setTitle(t(`عرض ${getSegmentMeta(targetSegment).label}`, `Special Offer for ${getSegmentMeta(targetSegment).label}`));
    }

    if (!isDiscountEdited) {
      setDiscountCode("EMAD15");
    }

    setMessageTemplate(getSegmentMeta(targetSegment).template);
  }, [targetSegment, isTitleEdited, isDiscountEdited, t]);

  const firstRecipient = recipients[0] ?? null;
  const previewMessage = personalizeMessage(messageTemplate, {
    name: firstRecipient?.full_name,
    drink: firstRecipient?.favorite_drink,
    discount: discountCode,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedMessage = messageTemplate.trim();

    if (!trimmedTitle) {
      setFormError(t("عنوان الحملة مطلوب.", "Campaign title is required."));
      return;
    }

    if (!trimmedMessage) {
      setFormError(t("نص الرسالة مطلوب.", "Message template is required."));
      return;
    }

    if (recipients.length === 0) {
      setFormError(t("لا يوجد عملاء في هذه الشريحة بعد.", "No customers in this segment."));
      return;
    }

    const input: CampaignInput = {
      title: trimmedTitle,
      target_segment: targetSegment,
      message_template: trimmedMessage,
      discount_code: discountCode.trim() || null,
      recipients_count: recipients.length,
    };

    setSubmitting(true);
    setFormError(null);

    try {
      await createCampaign.mutateAsync(input);
      pushToast({ title: t("تم إنشاء الحملة بنجاح! 🚀", "Campaign Launched! 🚀"), variant: "success" });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("تعذر إنشاء الحملة.", "Failed to launch."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConversion = async (campaign: Campaign) => {
    try {
      await updateCampaign.mutateAsync({
        id: campaign.id,
        input: { converted_count: campaign.converted_count + 1 },
      });
      pushToast({ title: t("تم تسجيل زيارة وتحويل جديد!", "Conversion Recorded!"), variant: "success" });
    } catch (error) {
      pushToast({
        title: error instanceof Error ? error.message : t("تعذر تسجيل التحويل.", "Failed to record conversion."),
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={{ ar: "حملات عماد أفندي", en: "Emad Afandi Marketing" }}
        title={{ ar: "حملات ولاء واسترجاع العملاء", en: "WhatsApp Loyalty Campaigns" }}
        description={{
          ar: "وجّه رسائل مخصصة باسم كل عميل ومشروبه المفضل لزيادة التكرار والأرباح.",
          en: "Personalized WhatsApp retention campaigns tailored to RFM loyalty segments.",
        }}
        actions={
          <Button type="button" variant="secondary" onClick={() => setPreviewOpen(true)}>
            <Send className="h-4 w-4 text-[#d4af37]" aria-hidden="true" />
            <span>{t("معاينة وإرسال عبر واتساب", "Preview & Send WhatsApp")}</span>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Campaign Creation Form */}
        <Card className="surface-glass p-5 lg:col-span-3 border border-[#d4af37]/20">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#F5EFE6]">
              {t("إنشاء حملة تسويقية جديدة", "Create New Campaign")}
            </h2>
            <Sparkles className="h-4 w-4 text-[#d4af37]" />
          </div>

          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
            {formError && (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-300"
              >
                {formError}
              </div>
            )}

            <Field label={t("الشريحة المستهدفة", "Target RFM Segment")} htmlFor="targetSegment" required>
              <Select
                id="targetSegment"
                value={targetSegment}
                onChange={(event) =>
                  setTargetSegment(event.target.value as CustomerSegment)
                }
              >
                {SEGMENT_ORDER.map((segment) => (
                  <option key={segment} value={segment}>
                    {getSegmentMeta(segment).label} ({getSegmentMeta(segment).description})
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("عنوان الحملة", "Campaign Title")} htmlFor="title" required>
                <Input
                  id="title"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setIsTitleEdited(true);
                  }}
                  placeholder="عرض قهوة الصباح"
                  required
                />
              </Field>

              <Field label={t("كود الخصم (Promo Code)", "Discount Code")} htmlFor="discountCode">
                <Input
                  id="discountCode"
                  value={discountCode}
                  onChange={(event) => {
                    setDiscountCode(event.target.value);
                    setIsDiscountEdited(true);
                  }}
                  placeholder="EMAD15"
                />
              </Field>
            </div>

            <Field label={t("قالب الرسالة (يدعم المتغيرات الذكية)", "Message Template (Smart Tags)")} htmlFor="messageTemplate" required>
              <Textarea
                id="messageTemplate"
                value={messageTemplate}
                onChange={(event) => setMessageTemplate(event.target.value)}
                rows={4}
                required
                className="font-medium text-xs leading-relaxed"
              />
              <p className="mt-1 text-[11px] text-[#9CA3AF]">
                {t(
                  "المتغيرات المدعومة: {{name}} اسم العميل • {{drink}} المشروب المفضل • {{discount}} كود الخصم",
                  "Tags: {{name}} Guest Name • {{drink}} Favorite Drink • {{discount}} Promo Code"
                )}
              </p>
            </Field>

            {/* Live Message Preview */}
            <div className="rounded-xl border border-[#d4af37]/25 bg-[#0d0f11] p-4 shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                <p className="text-xs font-bold text-[#c8a34b]">{t("معاينة الرسالة لايف كما ستصل للعميل", "Live WhatsApp Message Preview")}</p>
              </div>
              <p className="text-xs leading-relaxed text-[#F5EFE6] whitespace-pre-wrap">{previewMessage}</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-xs text-[#9CA3AF]">
                {recipientsLoading
                  ? t("جارٍ حساب العملاء...", "Calculating target audience...")
                  : t(
                      `${formatNumber(recipients.length)} عميل مؤهل في هذه الشريحة`,
                      `${formatNumber(recipients.length)} eligible guests in segment`
                    )}
              </p>
              <Button type="submit" loading={submitting} disabled={recipientsLoading} variant="primary">
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>{t("حفظ وإطلاق الحملة", "Launch Campaign")}</span>
              </Button>
            </div>
          </form>
        </Card>

        {/* Segment Stats Sidebar */}
        <div className="lg:col-span-2">
          <Card className="surface-glass p-5 border border-[#d4af37]/20">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-extrabold text-[#F5EFE6]">
                {t("بيانات الشريحة", "Segment Insights")}
              </h2>
              <SegmentBadge segment={targetSegment} showDot />
            </div>

            {recipientsLoading ? (
              <Skeleton className="h-28" />
            ) : (
              <div className="grid gap-3">
                <StatCard
                  label={t("حجم الجمهور المستهدف", "Target Reach")}
                  value={recipients.length}
                  tone="neutral"
                />
                <StatCard
                  label={t("نموذج من الجمهور", "Sample Recipient")}
                  value={firstRecipient?.full_name ?? "—"}
                  hint={firstRecipient?.favorite_drink ?? undefined}
                  tone="gold"
                />
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Campaigns History */}
      <Card className="surface-glass p-5 border border-[#d4af37]/20">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-[#F5EFE6]">
            {t("سجل أداء الحملات", "Campaign History & Conversions")}
          </h2>
          <Badge variant="brand">{formatNumber(campaigns.length)} {t("حملة", "campaigns")}</Badge>
        </div>

        {campaignsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={Megaphone}
            title={t("تعذر تحميل الحملات", "Failed to load campaigns")}
            description={t("حاول مرة أخرى.", "Please retry.")}
            action={
              <Button type="button" onClick={() => void refetch()} variant="primary">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span>{t("إعادة المحاولة", "Retry")}</span>
              </Button>
            }
          />
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title={t("لا توجد حملات تسويقية سابقة", "No campaigns yet")}
            description={t("أنشئ أول حملة ولاء لكافيه ومحمصة عماد أفندي من النموذج أعلاه.", "Create your first loyalty campaign from above.")}
          />
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign) => {
              const conversionRate =
                campaign.recipients_count > 0
                  ? Math.round((campaign.converted_count / campaign.recipients_count) * 100)
                  : 0;

              return (
                <div
                  key={campaign.id}
                  className="rounded-xl border border-white/5 bg-[#0d0f11] p-4 transition hover:border-[#d4af37]/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[#F5EFE6]">
                        {campaign.title}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <SegmentBadge segment={campaign.target_segment} showDot />
                        <span className="text-xs text-[#9CA3AF]">
                          {formatDateTime(campaign.created_at)}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleConversion(campaign)}
                      disabled={updateCampaign.isPending}
                    >
                      <span>+1 {t("تسجيل تحويل (زيارة)", "Add Conversion")}</span>
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <StatCard
                      label={t("المستلمون", "Recipients")}
                      value={campaign.recipients_count}
                      tone="neutral"
                    />
                    <StatCard
                      label={t("التحويلات المسجلة", "Conversions")}
                      value={campaign.converted_count}
                      tone="success"
                    />
                    <StatCard
                      label={t("معدل النجاح", "Conversion Rate")}
                      value={`${formatNumber(conversionRate)}%`}
                      tone="gold"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* WhatsApp Dispatch Modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={t("معاينة وإرسال عبر واتساب", "WhatsApp Broadcast Preview")}
        size="xl"
        footer={
          <Button type="button" variant="secondary" onClick={() => setPreviewOpen(false)}>
            <span>{t("إغلاق", "Close")}</span>
          </Button>
        }
      >
        <div className="space-y-6">
          <div className="rounded-xl border border-[#d4af37]/25 bg-[#0d0f11] p-4">
            <p className="text-xs font-bold text-[#c8a34b]">{t("نص الرسالة المخصصة", "Personalized Message")}</p>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#F5EFE6]">{previewMessage}</p>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-extrabold text-[#F5EFE6]">
                {t(`أول ${formatNumber(Math.min(recipients.length, 100))} عميل في القائمة`, `First ${formatNumber(Math.min(recipients.length, 100))} Recipients`)}
              </p>
              <Badge variant="neutral">{formatNumber(recipients.length)} {t("إجمالي", "total")}</Badge>
            </div>

            {recipientsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-14" />
                ))}
              </div>
            ) : recipients.length === 0 ? (
              <EmptyState
                icon={Users}
                title={t("لا يوجد عملاء", "No recipients")}
                description={t("لا يوجد عملاء في هذه الشريحة حالياً.", "No guests match this segment right now.")}
              />
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto no-scrollbar">
                {recipients.slice(0, 100).map((recipient: SegmentRecipient) => {
                  const link = buildWhatsAppLink(
                    recipient.phone_number,
                    personalizeMessage(messageTemplate, {
                      name: recipient.full_name,
                      drink: recipient.favorite_drink,
                      discount: discountCode,
                    }),
                  );

                  return (
                    <div
                      key={recipient.id}
                      className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#0d0f11] p-3 hover:border-[#d4af37]/25 transition"
                    >
                      <Avatar name={recipient.full_name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-[#F5EFE6]">
                          {recipient.full_name}
                        </p>
                        <p className="text-[11px] text-[#9CA3AF]">
                          {recipient.favorite_drink ? `${t("مشروبه:", "Drink:")} ${recipient.favorite_drink}` : "—"}
                        </p>
                      </div>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500 hover:text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t("إرسال واتساب", "WhatsApp")}</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
