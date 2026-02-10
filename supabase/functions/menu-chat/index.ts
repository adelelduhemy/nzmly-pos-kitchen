import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// SECURITY: Restrict CORS to your domains only
const ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:5173",
  "https://vyyagmzuxrqbzlaxoivy.supabase.co",
  // Add your production domain here
];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history = [], lang = 'ar' } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Google Gemini API key (stored as Supabase Edge Function secret)
    const GOOGLE_API_KEY = Deno.env.get("nzmly-pos-kitchen");
    if (!GOOGLE_API_KEY) {
      console.error("nzmly-pos-kitchen API key is not configured");
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch available menu items
    const { data: menuItems } = await supabase
      .from("menu_items")
      .select("id, name_ar, name_en, description_ar, description_en, price, category_id, is_featured")
      .eq("is_available", true)
      .order("display_order", { ascending: true });

    // Fetch categories
    const { data: categories } = await supabase
      .from("menu_categories")
      .select("id, name_ar, name_en")
      .eq("is_active", true);

    // Build menu context with category names
    const categoryMap = new Map(categories?.map(c => [c.id, c]) || []);
    const menuContext = menuItems?.map(item => {
      const cat = item.category_id ? categoryMap.get(item.category_id) : null;
      return {
        id: item.id,
        name_ar: item.name_ar,
        name_en: item.name_en,
        price: item.price,
        category_ar: cat?.name_ar || '',
      };
    }) || [];

    const isAr = lang === 'ar';

    const systemPrompt = `أنت مساعد ذكي لمطعم. مهمتك مساعدة العملاء في اختيار الأطباق.

قائمة الأطباق المتاحة:
${JSON.stringify(menuContext, null, 2)}

التعليمات:
1. رحب بالعميل بشكل ودي
2. اقترح أطباق من القائمة فقط
3. عند اقتراح طبق، اكتبه بهذا الشكل: [اسم_الطبق|السعر|معرف_الطبق]
4. كن مختصراً وودوداً
5. ${isAr ? 'أجب باللغة العربية' : 'Respond in English'}`;

    // Build conversation history for Gemini
    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟" }] },
      ...history.flatMap((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      })),
      { role: "user", parts: [{ text: message }] }
    ];

    // Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
        }),
      }
    );

    if (!response.ok) {
      console.error("Gemini API error:", response.status, await response.text());
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text ||
      (isAr ? "عذراً، حدث خطأ." : "Sorry, an error occurred.");

    return new Response(
      JSON.stringify({ message: assistantMessage, success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Menu chat error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { ...getCorsHeaders(null), "Content-Type": "application/json" } }
    );
  }
});
