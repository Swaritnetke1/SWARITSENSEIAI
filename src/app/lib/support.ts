export type SupportIcon =
  | 'telegram' | 'whatsapp' | 'instagram' | 'phone' | 'email'
  | 'message' | 'gift' | 'group' | 'youtube' | 'twitter' | 'link';

export interface SupportItem {
  id: string;
  icon: SupportIcon;
  label: string;
  value: string;   // URL, phone number, email, etc.
  hint?: string;   // small subtitle text
  enabled: boolean;
  order: number;
}

const KEY = 'ss_support_items';

const DEFAULTS: SupportItem[] = [
  { id: 'tg_support', icon: 'telegram', label: 'Telegram Support', value: 'https://t.me/', hint: 'Chat with us on Telegram', enabled: true, order: 0 },
  { id: 'tg_group',   icon: 'group',    label: 'Join Telegram Group', value: 'https://t.me/', hint: 'Community & updates', enabled: true, order: 1 },
  { id: 'wa',         icon: 'whatsapp', label: 'WhatsApp Support', value: 'https://wa.me/', hint: 'Quick support on WhatsApp', enabled: true, order: 2 },
  { id: 'email',      icon: 'email',    label: 'Email Us', value: 'mailto:support@swaritsensei.ai', hint: 'support@swaritsensei.ai', enabled: true, order: 3 },
  { id: 'phone',      icon: 'phone',    label: 'Call Us', value: 'tel:+91', hint: '+91 XXXXX XXXXX', enabled: false, order: 4 },
  { id: 'gift',       icon: 'gift',     label: 'Gift the Developer', value: 'https://t.me/', hint: 'Support dev on Telegram ❤️', enabled: true, order: 5 },
  { id: 'ig',         icon: 'instagram',label: 'Instagram', value: 'https://instagram.com/', hint: '@swaritsensei', enabled: false, order: 6 },
];

export function getSupportItems(): SupportItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : DEFAULTS;
  } catch { return DEFAULTS; }
}

export function saveSupportItems(items: SupportItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function resetSupportItems() {
  saveSupportItems(DEFAULTS);
}
