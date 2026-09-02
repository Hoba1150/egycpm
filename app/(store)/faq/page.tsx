import React from "react";
import FAQSection from "@/components/store/FAQSection";

export const metadata = {
  title: "الأسئلة الشائعة | CPM GARAGE",
  description: "إجابات على أكثر الأسئلة شيوعاً حول شحن وتعديل سيارات كار باركينج وطرق الدفع والتسليم.",
};

export default function FAQPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <FAQSection />
    </div>
  );
}
