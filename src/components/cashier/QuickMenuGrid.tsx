import { useState } from "react";
import { Coffee, Flame, IceCream, Plus, Minus, RotateCcw, Check } from "lucide-react";
import { CAFE_MENU_ITEMS, type MenuItem } from "@/lib/menuData";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface QuickMenuGridProps {
  onApplySelection: (totalAmount: number, itemsSummary: string) => void;
  selectedSummary?: string;
}

export function QuickMenuGrid({ onApplySelection }: QuickMenuGridProps) {
  const { lang } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<"all" | "specialty" | "cold" | "dessert">("all");
  const [cart, setCart] = useState<Record<string, number>>({});

  const filteredItems = CAFE_MENU_ITEMS.filter((item) => {
    if (selectedCategory === "all") return true;
    return item.category === selectedCategory;
  });

  const handleAddItem = (item: MenuItem) => {
    setCart((prev) => {
      const nextCount = (prev[item.id] || 0) + 1;
      const nextCart = { ...prev, [item.id]: nextCount };
      syncCart(nextCart);
      return nextCart;
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setCart((prev) => {
      const current = prev[itemId] || 0;
      if (current <= 1) {
        const { [itemId]: _, ...rest } = prev;
        syncCart(rest);
        return rest;
      }
      const nextCart = { ...prev, [itemId]: current - 1 };
      syncCart(nextCart);
      return nextCart;
    });
  };

  const handleResetCart = () => {
    setCart({});
    onApplySelection(0, "");
  };

  const syncCart = (updatedCart: Record<string, number>) => {
    let total = 0;
    const summaries: string[] = [];

    for (const [id, qty] of Object.entries(updatedCart)) {
      if (qty <= 0) continue;
      const item = CAFE_MENU_ITEMS.find((m) => m.id === id);
      if (item) {
        total += item.price * qty;
        const name = lang === "ar" ? item.nameAr : item.nameEn;
        summaries.push(`${qty}x ${name}`);
      }
    }

    onApplySelection(total, summaries.join(" + "));
  };

  const totalCartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalCartAmount = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = CAFE_MENU_ITEMS.find((m) => m.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  return (
    <div className="surface rounded-2xl p-4 border border-[#262b32] space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-[#20252b] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
            <Coffee size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {lang === "ar" ? "قائمة مشروبات عماد أفندي السريعة" : "Emad Afandi Quick Menu"}
            </h3>
            <p className="text-xs text-neutral-400">
              {lang === "ar" ? "اختر المشروبات لحساب الفاتورة تلقائياً" : "Click items to calculate bill"}
            </p>
          </div>
        </div>

        {totalCartCount > 0 && (
          <button
            type="button"
            onClick={handleResetCart}
            className="text-xs text-neutral-400 hover:text-red-400 flex items-center gap-1 transition-colors px-2 py-1 rounded bg-[#131619] border border-[#2a2f37]"
          >
            <RotateCcw size={12} />
            <span>{lang === "ar" ? "تفريغ" : "Clear"}</span>
          </button>
        )}
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            selectedCategory === "all"
              ? "bg-gold text-black font-bold shadow-sm"
              : "bg-[#14181c] text-neutral-400 hover:text-white border border-[#242930]"
          }`}
        >
          {lang === "ar" ? "الكل" : "All"}
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory("specialty")}
          className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-all ${
            selectedCategory === "specialty"
              ? "bg-gold text-black font-bold shadow-sm"
              : "bg-[#14181c] text-neutral-400 hover:text-white border border-[#242930]"
          }`}
        >
          <Flame size={13} />
          <span>{lang === "ar" ? "قهوة مختصة" : "Specialty"}</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory("cold")}
          className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-all ${
            selectedCategory === "cold"
              ? "bg-gold text-black font-bold shadow-sm"
              : "bg-[#14181c] text-neutral-400 hover:text-white border border-[#242930]"
          }`}
        >
          <Coffee size={13} />
          <span>{lang === "ar" ? "مشروبات باردة" : "Iced Drinks"}</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory("dessert")}
          className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-all ${
            selectedCategory === "dessert"
              ? "bg-gold text-black font-bold shadow-sm"
              : "bg-[#14181c] text-neutral-400 hover:text-white border border-[#242930]"
          }`}
        >
          <IceCream size={13} />
          <span>{lang === "ar" ? "حلى ومخبوزات" : "Desserts"}</span>
        </button>
      </div>

      {/* Grid of items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1">
        {filteredItems.map((item) => {
          const qty = cart[item.id] || 0;
          const isSelected = qty > 0;

          return (
            <div
              key={item.id}
              className={`relative flex flex-col justify-between p-2.5 rounded-xl border transition-all text-right select-none ${
                isSelected
                  ? "bg-gold/10 border-gold/60 shadow-[0_0_12px_rgba(212,175,55,0.15)]"
                  : "bg-[#101316] border-[#22272e] hover:border-gold/30 hover:bg-[#15191e]"
              }`}
            >
              <div>
                {item.badge && (
                  <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-gold/20 text-gold mb-1">
                    {item.badge}
                  </span>
                )}
                <div className="text-xs font-bold text-white truncate">
                  {lang === "ar" ? item.nameAr : item.nameEn}
                </div>
                <div className="text-xs font-semibold text-gold mt-0.5">
                  {formatCurrency(item.price)}
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-1 pt-1.5 border-t border-[#1e232a]">
                {isSelected ? (
                  <div className="flex items-center justify-between w-full">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="w-6 h-6 rounded-md bg-[#1a1f26] border border-[#2a303a] hover:bg-red-500/20 hover:text-red-400 text-neutral-300 flex items-center justify-center transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-bold text-gold px-1.5">{qty}</span>
                    <button
                      type="button"
                      onClick={() => handleAddItem(item)}
                      className="w-6 h-6 rounded-md bg-gold text-black flex items-center justify-center font-bold hover:brightness-110 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAddItem(item)}
                    className="w-full py-1 rounded-md bg-[#171b21] hover:bg-gold hover:text-black border border-[#282f3a] text-neutral-300 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <Plus size={12} />
                    <span>{lang === "ar" ? "إضافة" : "Add"}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Summary Bar */}
      {totalCartCount > 0 && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-gold/10 border border-gold/30 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-gold text-black font-extrabold flex items-center justify-center text-[10px]">
              {totalCartCount}
            </span>
            <span className="text-neutral-200 font-medium">
              {lang === "ar" ? "إجمالي المنتجات المختارة" : "Selected Total"}:
            </span>
            <span className="text-sm font-bold text-gold">
              {formatCurrency(totalCartAmount)}
            </span>
          </div>

          <div className="text-[11px] text-neutral-400 flex items-center gap-1">
            <Check size={13} className="text-gold" />
            <span>{lang === "ar" ? "مطبقة على الفاتورة" : "Applied to Bill"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
