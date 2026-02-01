import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Trash2, ShoppingCart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMenuChat, ChatMessage } from '@/hooks/useMenuChat';
import { usePublicCartStore } from '@/store/publicCartStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MenuChatbotProps {
  menuSlug?: string;
  lang?: 'ar' | 'en';
  primaryColor?: string;
}

interface ParsedItem {
  name: string;
  price: number;
  id: string;
}

// Parse suggested items from AI response: [name|price|id]
const parseItemsFromMessage = (content: string): { text: string; items: ParsedItem[] } => {
  const itemRegex = /\[([^\]|]+)\|(\d+(?:\.\d+)?)\|([a-f0-9-]+)\]/g;
  const items: ParsedItem[] = [];
  let cleanText = content;
  
  let match;
  while ((match = itemRegex.exec(content)) !== null) {
    items.push({
      name: match[1].trim(),
      price: parseFloat(match[2]),
      id: match[3],
    });
    cleanText = cleanText.replace(match[0], `**${match[1]}** (${match[2]} ر.س)`);
  }
  
  return { text: cleanText, items };
};

const MenuChatbot = ({ menuSlug, lang = 'ar', primaryColor = '#2563EB' }: MenuChatbotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addToCart = usePublicCartStore((state) => state.addItem);
  const cartItemCount = usePublicCartStore((state) => state.getItemCount());

  const { messages, isLoading, error, sendMessage, clearMessages } = useMenuChat({
    menuSlug,
    lang,
  });

  const isAr = lang === 'ar';

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleAddToCart = (item: ParsedItem) => {
    addToCart({
      id: item.id,
      name_ar: item.name,
      name_en: item.name,
      price: item.price,
    });
    toast.success(isAr ? `تمت إضافة ${item.name} للسلة` : `${item.name} added to cart`);
  };

  const quickActions = isAr
    ? ['أريد اقتراحات للعشاء', 'ما هي الأطباق المميزة؟', 'أبحث عن طبق خفيف']
    : ['Suggest dinner options', 'What are the specials?', "I'm looking for something light"];

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed z-50 p-4 rounded-full shadow-2xl",
          isAr ? "left-4 bottom-4" : "right-4 bottom-4"
        )}
        style={{ backgroundColor: primaryColor }}
        aria-label={isAr ? "فتح المحادثة" : "Open chat"}
      >
        <MessageCircle className="w-6 h-6 text-white" />
        {cartItemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {cartItemCount}
          </span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
            />

            {/* Chat Container */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                "fixed z-50 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col",
                "w-full h-[80vh] bottom-0 left-0 right-0 md:w-96 md:h-[500px]",
                isAr ? "md:left-4 md:bottom-4 md:right-auto" : "md:right-4 md:bottom-4 md:left-auto"
              )}
              dir={isAr ? 'rtl' : 'ltr'}
            >
              {/* Header */}
              <div 
                className="flex items-center justify-between px-4 py-3 text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-bold">
                    {isAr ? 'مساعد الطلب الذكي' : 'Smart Order Assistant'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {cartItemCount > 0 && (
                    <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full text-xs">
                      <ShoppingCart className="w-3 h-3" />
                      <span>{cartItemCount}</span>
                    </div>
                  )}
                  {messages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearMessages}
                      className="text-white/80 hover:text-white hover:bg-white/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="text-white/80 hover:text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Welcome Message */}
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <div 
                      className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <MessageCircle className="w-8 h-8" style={{ color: primaryColor }} />
                    </div>
                    <h3 className="font-bold text-lg text-zinc-800 dark:text-white mb-2">
                      {isAr ? 'مرحباً! 👋' : 'Hello! 👋'}
                    </h3>
                    <p className="text-sm text-zinc-500 mb-4">
                      {isAr 
                        ? 'أنا هنا لمساعدتك في اختيار الطبق المناسب. أخبرني عن تفضيلاتك!'
                        : "I'm here to help you choose the perfect dish. Tell me your preferences!"}
                    </p>
                    
                    {/* Quick Actions */}
                    <div className="space-y-2">
                      {quickActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => sendMessage(action)}
                          disabled={isLoading}
                          className="w-full px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Messages */}
                {messages.map((msg) => (
                  <MessageBubble 
                    key={msg.id} 
                    message={msg} 
                    isAr={isAr} 
                    primaryColor={primaryColor}
                    onAddToCart={handleAddToCart}
                  />
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{isAr ? 'جاري الكتابة...' : 'Typing...'}</span>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Type your message...'}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={!inputValue.trim() || isLoading}
                    style={{ backgroundColor: primaryColor }}
                    className="shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Message Bubble Component
const MessageBubble = ({ 
  message, 
  isAr, 
  primaryColor,
  onAddToCart,
}: { 
  message: ChatMessage; 
  isAr: boolean;
  primaryColor: string;
  onAddToCart: (item: ParsedItem) => void;
}) => {
  const isUser = message.role === 'user';
  const { text, items } = parseItemsFromMessage(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col",
        isUser ? "items-end" : "items-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] px-4 py-2 rounded-2xl text-sm",
          isUser 
            ? "text-white rounded-br-sm" 
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-white rounded-bl-sm"
        )}
        style={isUser ? { backgroundColor: primaryColor } : undefined}
      >
        <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ 
          __html: text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') 
        }} />
      </div>

      {/* Suggested Items with Add to Cart */}
      {!isUser && items.length > 0 && (
        <div className="mt-2 space-y-2 w-full max-w-[85%]">
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-between bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 shadow-sm"
            >
              <div>
                <p className="font-bold text-zinc-800 dark:text-white text-sm">{item.name}</p>
                <p className="text-xs" style={{ color: primaryColor }}>
                  {item.price} {isAr ? 'ر.س' : 'SAR'}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => onAddToCart(item)}
                style={{ backgroundColor: primaryColor }}
                className="text-white gap-1"
              >
                <Plus className="w-4 h-4" />
                {isAr ? 'أضف' : 'Add'}
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MenuChatbot;
