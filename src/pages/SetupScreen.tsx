import { useState } from "react";
import { Check, Copy, Database, KeyRound, Rocket, TableProperties } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Misc";
import { PageHeader } from "@/components/layout/PageHeader";
import { SUPABASE_SETUP_MESSAGE } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";

const ENV_BLOCK = `VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`;

export function SetupScreen() {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const copyEnv = async () => {
    try {
      await navigator.clipboard.writeText(ENV_BLOCK);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-black-900 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow={{ ar: "الإعداد", en: "Setup" }}
          title={{ ar: "إعداد Supabase", en: "Setup Supabase" }}
          description={{ ar: "أضف بيانات مشروع Supabase ثم طبّق ملفات قاعدة البيانات لتشغيل التطبيق.", en: "Add your Supabase credentials then apply the database files to run the app." }}
        />

        <Card className="surface-glass p-6 sm:p-8">
          <div className="flex items-start gap-3 rounded-card border border-white/10 bg-black-200/5 p-4">
            <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-gold-700" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-black-50">بيانات Supabase غير مضافة بعد.</p>
              <p className="mt-1 text-xs leading-6 text-black-50/65">{SUPABASE_SETUP_MESSAGE}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-black-50">ملف .env</p>
              <Button type="button" variant="secondary" size="sm" onClick={() => void copyEnv()}>
                {copied ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                {copied ? "تم النسخ" : "Copy"}
              </Button>
            </div>
            <pre
              dir="ltr"
              className="overflow-x-auto rounded-card border border-white/10 bg-black-50 p-4 text-left text-xs leading-6 text-cream"
            >
              {ENV_BLOCK}
            </pre>
          </div>

          <div className="mt-8 space-y-4">
            <p className="text-sm font-bold text-black-50">خطوات التشغيل</p>
            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black-200/5 text-black-50">
                <Database className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-black-50">أنشئ مشروعاً في Supabase</p>
                <p className="mt-1 text-xs leading-6 text-black-50/60">
                  من لوحة Supabase، انسخ الـ Project URL والـ anon public key.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black-200/5 text-black-50">
                <TableProperties className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-black-50">طبّق ملفات قاعدة البيانات</p>
                <p className="mt-1 text-xs leading-6 text-black-50/60">
                  افتح SQL Editor ونفّذ محتوى ملف supabase/schema.sql ثم محتوى ملف supabase/seed.sql.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black-200/5 text-black-50">
                <Rocket className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-black-50">أعد تشغيل التطبيق</p>
                <p className="mt-1 text-xs leading-6 text-black-50/60">
                  بعد حفظ .env وإعداد قاعدة البيانات، أعد تشغيل خادم التطوير.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
