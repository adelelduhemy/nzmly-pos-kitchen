import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history = [], menu_slug, lang = 'ar' } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch menu items
    const { data: menuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("id, name_ar, name_en, description_ar, description_en, price, category, image_url, is_featured")
      .eq("is_available", true)
      .order("display_order", { ascending: true });

    if (menuError) {
      console.error("Error fetching menu items:", menuError);
      throw new Error("Failed to fetch menu data");
    }

    // Fetch categories
    const { data: categories, error: catError } = await supabase
      .from("menu_categories")
      .select("id, name_ar, name_en, icon")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (catError) {
      console.error("Error fetching categories:", catError);
      throw new Error("Failed to fetch categories");
    }

    // Build menu context with category names
    const categoryMap = new Map(categories?.map(c => [c.id, c]) || []);
    const menuContext = menuItems?.map(item => {
      const cat = categoryMap.get(item.category);
      return {
        id: item.id,
        name_ar: item.name_ar,
        name_en: item.name_en,
        description_ar: item.description_ar,
        description_en: item.description_en,
        price: item.price,
        category_ar: cat?.name_ar || '',
        category_en: cat?.name_en || '',
        is_featured: item.is_featured,
      };
    }) || [];

    const isAr = lang === 'ar';
    
    // Extract available item names for availability checking
    const availableItemNames = menuContext.map(item => ({
      name_ar: item.name_ar?.toLowerCase().trim(),
      name_en: item.name_en?.toLowerCase().trim(),
      id: item.id,
      price: item.price,
    }));

    // Build system prompt with improved availability checking
    const systemPrompt = `أنت مساعد ذكي لمطعم. مهمتك مساعدة العملاء في اختيار الأطباق المناسبة لهم.

قائمة الأطباق المتاحة حالياً:
${JSON.stringify(menuContext, null, 2)}

التعليمات المهمة:
1. رحب بالعميل بشكل ودي
2. اسأله عن تفضيلاته (نوع الطعام، الميزانية، عدد الأشخاص، الحساسية)
3. اقترح أطباق مناسبة من القائمة فقط
4. **مهم جداً**: عند اقتراح طبق، اكتبه بهذا الشكل: [اسم_الطبق|السعر|معرف_الطبق]
   مثال: [كفته|120|4b2e2743-c31c-4940-bcb3-9555fcaecfee]
5. كن مختصراً وودوداً واستخدم الإيموجي
6. ${isAr ? 'أجب باللغة العربية دائماً' : 'Always respond in English'}

قواعد التحقق من توفر الأطباق:
- إذا طلب العميل طبقاً موجوداً في القائمة أعلاه، أخبره أنه متوفر واقترحه
- إذا طلب العميل طبقاً غير موجود في القائمة (مثل: بطاطس، بيتزا، برجر، إلخ)، أخبره بلطف:
  "للأسف هذا الطبق غير متوفر حالياً 😔 لكن سيتوفر قريباً إن شاء الله! 🔜"
  ثم اقترح عليه بدائل متاحة من القائمة
- لا تخترع أطباق غير موجودة في القائمة أبداً

أسماء الأطباق المتوفرة للتحقق:
${availableItemNames.map(i => `- ${i.name_ar} (${i.name_en || 'N/A'})`).join('\n')}

مثال على الأسئلة التي يمكنك طرحها:
- هل تفضل أكل حار أو خفيف؟
- هل عندك حساسية من شيء معين؟
- كم عدد الأشخاص؟
- هل تفضل لحم أو دجاج أو أسماك أو نباتي؟
- ما ميزانيتك التقريبية؟`;

    // Build messages array
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: false,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: isAr ? "تم تجاوز الحد الأقصى للطلبات، حاول لاحقاً" : "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: isAr ? "انتهت الوحدات المتاحة" : "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("AI Gateway error");
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || (isAr ? "عذراً، حدث خطأ. حاول مرة أخرى." : "Sorry, an error occurred. Please try again.");

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        success: true 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Menu chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
