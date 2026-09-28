import { NextResponse } from "next/server";
import { currentProfileOrNull } from "@/lib/queries";
import { getNotifications, getUnreadCount, BELL_ITEMS } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * Bell feed (Release E): latest items + unread count for the signed-in
 * profile. Guests get an empty 200 (the bell simply never renders for them;
 * the route stays quiet rather than leaking session state).
 */
export async function GET() {
  const profile = await currentProfileOrNull();
  if (!profile) {
    return NextResponse.json({ unread: 0, items: [] });
  }
  const [unread, items] = await Promise.all([
    getUnreadCount(profile.id),
    getNotifications(profile.id, BELL_ITEMS),
  ]);
  return NextResponse.json({ unread, items });
}
