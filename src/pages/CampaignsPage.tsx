import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ExternalLink, Megaphone, Plus, RefreshCw, Send, Users } from "lucide-react";
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
import type { Campaign, CampaignInput, CustomerSegment } from "@/types/crm";

export function CampaignsPage() {
  const [targetSegment, setTargetSegment] = useState<CustomerSegment>("VIP_CHAMPION");
  const [title, setTitle] = useState("");
  const [discountCode, setDiscountCode] = useState("BARISTA10");
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
      setTitle(`عرض ${getSegmentMeta(targetSegment).label}`);
    }

    if (!isDiscountEdited) {
      setDiscountCode("BARISTA10");
    }

    setMessageTemplate(getSegmentMeta(targetSegment).template);
  }, [targetSegment, isTitleEdited, isDiscountEdited]);

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
      setFormError("عنوان الحملة مطلوب.");
      return;
    }

    if (!trimmedMessage) {
      setFormError("نص الرسالة مطلوب.");
      return;
    }

    if (recipients.length === 0) {
      setFormError("لا يوجد عملاء في هذه الشريحة.");
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
      pushToast({ title: "تم إنشاء الحملة", variant: "success" });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "تعذر إنشاء الحملة.");
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
      pushToast({ title: "تم تسجيل التحويل", variant: "success" });
    } catch (error) {
      pushToast({
        title: error instanceof Error ? error.message : "تعذر تسجيل التحويل.",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="الحملات"
        title="حملات واتساب"
        description="أنشئ حملة لشريحة عملاء محددة وتابع التحويلات."
        actions={
          <Button type="button" onClick={() => setPreviewOpen(true)}>
            <Send className="h-4 w-4" aria-hidden="true" />
            معاينة الحملة
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <h2 className="mb-4 text-base font-extrabold text-brand-950">إنشاء حملة</h2>

          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
            {formError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700"
              >
                {formError}
              </div>
            )}

            <Field label="الشريحة المستهدفة" htmlFor="targetSegment" required>
              <Select
                id="targetSegment"
                value={targetSegment}
                onChange={(event) =>
                  setTargetSegment(event.target.value as CustomerSegment)
                }
              >
                {SEGMENT_ORDER.map((segment) => (
                  <option key={segment} value={segment}>
                    {getSegmentMeta(segment).label}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="عنوان الحملة" htmlFor="title" required>
                <Input
                  id="title"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setIsTitleEdited(true);
                  }}
                  placeholder="عرض خاص"
                  required
                />
              </Field>

              <Field label="كود الخصم" htmlFor="discountCode">
                <Input
                  id="discountCode"
                  value={discountCode}
                  onChange={(event) => {
                    setDiscountCode(event.target.value);
                    setIsDiscountEdited(true);
                  }}
                  placeholder="BARISTA10"
                />
              </Field>
            </div>

            <Field label="نص الرسالة" htmlFor="messageTemplate" required>
              <Textarea
                id="messageTemplate"
                value={messageTemplate}
                onChange={(event) => setMessageTemplate(event.target.value)}
                rows={5}
                required
              />
            </Field>

            <div className="rounded-2xl border border-brand-950/10 bg-white/60 p-4">
              <p className="text-xs font-bold text-brand-950/55">معاينة الرسالة</p>
              <p className="mt-2 text-sm leading-7 text-brand-950">{previewMessage}</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-brand-950/55">
                {recipientsLoading
                  ? "جارٍ تحميل عدد العملاء..."
                  : `${formatNumber(recipients.length)} عميل في الشريحة`}
              </p>
              <Button type="submit" loading={submitting} disabled={recipientsLoading}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                إنشاء الحملة
              </Button>
            </div>
          </form>
        </Card>

        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-extrabold text-brand-950">إحصائيات الشريحة</h2>
              <SegmentBadge segment={targetSegment} showDot />
            </div>

            {recipientsLoading ? (
              <Skeleton className="h-24" />
            ) : (
              <div className="grid gap-3">
                <StatCard
                  label="عدد العملاء"
                  value={recipients.length}
                  tone="neutral"
                />
                <StatCard
                  label="أول عميل"
                  value={firstRecipient?.full_name ?? "—"}
                  hint={firstRecipient?.favorite_drink ?? undefined}
                  tone="gold"
                />
                <StatCard
                  label="حد الإرسال"
                  value={formatNumber(1000)}
                  hint="أقصى عدد مستلمين في الحملة"
                  tone="neutral"
                />
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-brand-950">سجل الحملات</h2>
          <Badge variant="brand">{formatNumber(campaigns.length)} حملة</Badge>
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
            title="تعذر تحميل الحملات"
            description="حاول مرة أخرى."
            action={
              <Button type="button" onClick={() => void refetch()}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                إعادة المحاولة
              </Button>
            }
          />
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="لا توجد حملات"
            description="أنشئ أول حملة من النموذج أعلاه."
          />
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const conversionRate =
                campaign.recipients_count > 0
                  ? Math.round((campaign.converted_count / campaign.recipients_count) * 100)
                  : 0;

              return (
                <div
                  key={campaign.id}
                  className="rounded-2xl border border-brand-950/10 bg-white/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-brand-950">
                        {campaign.title}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <SegmentBadge segment={campaign.target_segment} showDot />
                        <span className="text-xs text-brand-950/55">
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
                      +1 تحويل
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <StatCard
                      label="المستلمون"
                      value={campaign.recipients_count}
                      tone="neutral"
                    />
                    <StatCard
                      label="التحويلات"
                      value={campaign.converted_count}
                      tone="success"
                    />
                    <StatCard
                      label="معدل التحويل"
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

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="معاينة الحملة"
        size="xl"
        footer={
          <Button type="button" variant="secondary" onClick={() => setPreviewOpen(false)}>
            إغلاق
          </Button>
        }
      >
        <div className="space-y-6">
          <div className="rounded-2xl border border-brand-950/10 bg-white/60 p-4">
            <p className="text-xs font-bold text-brand-950/55">الرسالة المخصصة</p>
            <p className="mt-2 text-sm leading-7 text-brand-950">{previewMessage}</p>
            {firstRecipient && (
              <p className="mt-3 text-xs text-brand-950/55">
                أول مستلم: {firstRecipient.full_name}
              </p>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-extrabold text-brand-950">
                أول {formatNumber(Math.min(recipients.length, 100))} مستلم
              </p>
              <Badge variant="neutral">{formatNumber(recipients.length)} إجمالي</Badge>
            </div>

            {recipientsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-16" />
                ))}
              </div>
            ) : recipients.length === 0 ? (
              <EmptyState
                icon={Users}
                title="لا يوجد مستلمون"
                description="لا يوجد عملاء في هذه الشريحة بعد."
              />
            ) : (
              <div className="max-h-96 space-y-3 overflow-y-auto">
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
                      className="flex items-center gap-3 rounded-2xl border border-brand-950/10 bg-white/60 p-3"
                    >
                      <Avatar name={recipient.full_name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-brand-950">
                          {recipient.full_name}
                        </p>
                        <p className="text-xs text-brand-950/55">
                          {recipient.favorite_drink ?? "—"}
                        </p>
                      </div>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 focus-ring"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        واتساب
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
