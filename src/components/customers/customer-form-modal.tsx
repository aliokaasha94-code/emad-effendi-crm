import { useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/contexts/LanguageContext";
import { isValidEgyptianMobile } from "@/lib/phone";
import { SEGMENT_ORDER, getSegmentMeta } from "@/lib/segments";
import type { Customer, CustomerInput, CustomerSegment } from "@/types/crm";

export interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  editing: Customer | null;
  onSubmit: (input: CustomerInput) => Promise<void>;
  submitting: boolean;
  formError: string | null;
}

export function CustomerFormModal({
  open,
  onClose,
  editing,
  onSubmit,
  submitting,
  formError,
}: CustomerFormModalProps) {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState(editing?.full_name ?? "");
  const [phone, setPhone] = useState(editing?.phone_number ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(editing?.date_of_birth ?? "");
  const [favoriteDrink, setFavoriteDrink] = useState(editing?.favorite_drink ?? "");
  const [preferredSeating, setPreferredSeating] = useState(editing?.preferred_seating ?? "");
  const [customNotes, setCustomNotes] = useState(editing?.custom_notes ?? "");
  const [formSegment, setFormSegment] = useState<CustomerSegment>(editing?.segment ?? "CUSTOM");
  const [roastPreference, setRoastPreference] = useState(editing?.roast_preference ?? "");
  const [grindPreference, setGrindPreference] = useState(editing?.grind_preference ?? "");
  const [flavorNotes, setFlavorNotes] = useState(editing?.flavor_notes_preference ?? "");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: CustomerInput = {
      full_name: fullName.trim(),
      phone_number: phone.trim(),
      email: email.trim() || null,
      date_of_birth: dateOfBirth.trim() || null,
      favorite_drink: favoriteDrink.trim() || null,
      preferred_seating: preferredSeating.trim() || null,
      custom_notes: customNotes.trim() || null,
      segment: formSegment,
      roast_preference: (roastPreference as any) || null,
      grind_preference: (grindPreference as any) || null,
      flavor_notes_preference: flavorNotes.trim() || null,
    };
    await onSubmit(input);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t("تعديل عميل", "Edit Customer") : t("إضافة عميل", "Add Customer")}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("إلغاء", "Cancel")}
          </Button>
          <Button type="submit" form="customer-form" loading={submitting}>
            {editing ? t("حفظ التعديلات", "Save Changes") : t("إضافة العميل", "Add Customer")}
          </Button>
        </>
      }
    >
      <form id="customer-form" onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/30 bg-rose-500/15 p-3 text-xs font-bold text-rose-300"
          >
            {formError}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("اسم العميل", "Customer Name")} htmlFor="fullName" required>
            <Input
              id="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="أحمد محمد"
              required
            />
          </Field>

          <Field label={t("رقم الهاتف", "Phone Number")} htmlFor="phone" required>
            <Input
              id="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="01012345678"
              inputMode="tel"
              required
            />
          </Field>

          <Field label={t("البريد الإلكتروني", "Email")} htmlFor="email">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="customer@example.com"
              dir="ltr"
            />
          </Field>

          <Field label={t("تاريخ الميلاد", "Date of Birth")} htmlFor="dateOfBirth">
            <Input id="dateOfBirth" type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
          </Field>

          <Field label={t("المشروب المفضل", "Favorite Drink")} htmlFor="favoriteDrink">
            <Input id="favoriteDrink" value={favoriteDrink} onChange={(event) => setFavoriteDrink(event.target.value)} placeholder="لاتيه" />
          </Field>

          <Field label={t("المكان المفضل", "Preferred Seating")} htmlFor="preferredSeating">
            <Input id="preferredSeating" value={preferredSeating} onChange={(event) => setPreferredSeating(event.target.value)} placeholder="ركن الهدوء" />
          </Field>

          <Field label={t("درجة التحميص المفضلة (Roast)", "Preferred Roast")} htmlFor="roast">
            <Select id="roast" value={roastPreference} onChange={(event) => setRoastPreference(event.target.value)}>
              <option value="">{t("غير محدد", "Not specified")}</option>
              <option value="LIGHT">{t("تحميص فاتح (Light)", "Light Roast")}</option>
              <option value="MEDIUM">{t("تحميص وسط متوازن (Medium)", "Medium Roast")}</option>
              <option value="DARK">{t("تحميص غامق كثيف (Dark)", "Dark Roast")}</option>
            </Select>
          </Field>

          <Field label={t("طريقة ونعومة الطحن (Grind)", "Grind Size")} htmlFor="grind">
            <Select id="grind" value={grindPreference} onChange={(event) => setGrindPreference(event.target.value)}>
              <option value="">{t("غير محدد", "Not specified")}</option>
              <option value="WHOLE_BEAN">{t("حبوب بن كاملة (Whole Bean)", "Whole Bean")}</option>
              <option value="TURKISH">{t("طحنة تركي ناعمة جداً", "Extra-Fine Turkish")}</option>
              <option value="ESPRESSO">{t("طحنة اسبريسو ناعمة", "Fine Espresso")}</option>
              <option value="V60_FILTER">{t("طحنة فلتر V60 / كيمكس", "Medium V60 / Filter")}</option>
              <option value="FRENCH_PRESS">{t("طحنة فرنش برس / كولد برو", "Coarse French Press")}</option>
            </Select>
          </Field>

          <Field label={t("الإيحاءات والنكهات المفضلة", "Flavor Profile")} htmlFor="flavorNotes" className="sm:col-span-2">
            <Input
              id="flavorNotes"
              value={flavorNotes}
              onChange={(event) => setFlavorNotes(event.target.value)}
              placeholder="مثال: شوكولاتة وبندق، فواكه حمضية، كراميل..."
            />
          </Field>
        </div>

        <Field label={t("التصنيف", "Segment")} htmlFor="segment">
          <Select id="segment" value={formSegment} onChange={(event) => setFormSegment(event.target.value as CustomerSegment)}>
            {SEGMENT_ORDER.map((segment) => (
              <option key={segment} value={segment}>{getSegmentMeta(segment).label}</option>
            ))}
          </Select>
          </Field>

          <Field label={t("ملاحظات", "Notes")} htmlFor="customNotes">
            <Textarea id="customNotes" value={customNotes} onChange={(event) => setCustomNotes(event.target.value)} placeholder={t("أي ملاحظات عن تفضيلات العميل", "Any notes about customer preferences")} />
          </Field>
        </form>
      </Modal>
    );
}
