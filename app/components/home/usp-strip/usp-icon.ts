import {
  BadgeCheck,
  Clock,
  CreditCard,
  Gift,
  Headphones,
  MapPin,
  MessageCircle,
  Package,
  Percent,
  Phone,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Smartphone,
  Store,
  Truck,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/** Іконка, якщо в метаоб'єкті назва, якої немає в переліку нижче. */
export const USP_FALLBACK_ICON: LucideIcon = BadgeCheck;

/**
 * Іконки, які можна вказати в полі «іконка» метаоб'єкта `usp`.
 * Перелік явний, щоб у бандл не потрапляв увесь набір lucide. Ключі — назви lucide
 * малими літерами без дефісів: «shield-check», «ShieldCheck» і «shieldcheck» дають одне.
 */
const USP_ICONS: Record<string, LucideIcon> = {
  badgecheck: BadgeCheck,
  clock: Clock,
  creditcard: CreditCard,
  gift: Gift,
  headphones: Headphones,
  mappin: MapPin,
  messagecircle: MessageCircle,
  package: Package,
  percent: Percent,
  phone: Phone,
  refreshcw: RefreshCw,
  rotateccw: RotateCcw,
  send: Send,
  shieldcheck: ShieldCheck,
  smartphone: Smartphone,
  store: Store,
  truck: Truck,
  wallet: Wallet,
  wrench: Wrench,
};

/** Назва іконки lucide з метаоб'єкта → компонент. Невідома назва дає запасну іконку. */
export function resolveUspIcon(name: string | null | undefined): LucideIcon {
  const key = (name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return (Object.hasOwn(USP_ICONS, key) ? USP_ICONS[key] : undefined) ?? USP_FALLBACK_ICON;
}
