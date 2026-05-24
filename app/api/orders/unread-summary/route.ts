import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getOrderAccessContext } from "@/lib/orders/access";
import { getUnreadCountsForOrders, type MessageViewer } from "@/lib/orders/read-state";
import { isSupportEmail } from "@/lib/support/auth";
import db from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const viewerParam = url.searchParams.get("viewer");
  const orderId = url.searchParams.get("orderId");
  const token = url.searchParams.get("token");

  let viewer: MessageViewer;

  if (viewerParam === "seller") {
    if (!isSupportEmail(session.user.email)) {
      return Response.json({ error: "Доступ запрещён" }, { status: 403 });
    }
    viewer = "seller";
  } else if (orderId) {
    const access = await getOrderAccessContext(orderId, token);
    if (!access) {
      return Response.json({ error: "Доступ запрещён" }, { status: 403 });
    }
    viewer = access.authorRole;
  } else {
    viewer = isSupportEmail(session.user.email) ? "seller" : "buyer";
  }

  if (orderId) {
    const access = await getOrderAccessContext(orderId, token);
    if (!access) {
      return Response.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const counts = await getUnreadCountsForOrders([orderId], access.authorRole);
    return Response.json({
      totalUnread: counts.get(orderId) ?? 0,
      orders: [{ orderId, unreadCount: counts.get(orderId) ?? 0 }],
    });
  }

  if (viewer === "seller") {
    const orders = await db.order.findMany({ select: { id: true } });
    const counts = await getUnreadCountsForOrders(
      orders.map((order) => order.id),
      "seller",
    );

    let totalUnread = 0;
    const orderSummaries = orders.map((order) => {
      const unreadCount = counts.get(order.id) ?? 0;
      totalUnread += unreadCount;
      return { orderId: order.id, unreadCount };
    });

    return Response.json({ totalUnread, orders: orderSummaries });
  }

  const userOrders = await db.order.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const orderIds = userOrders.map((order) => order.id);
  const counts = await getUnreadCountsForOrders(orderIds, "buyer");

  let totalUnread = 0;
  const orderSummaries = userOrders.map((order) => {
    const unreadCount = counts.get(order.id) ?? 0;
    totalUnread += unreadCount;
    return { orderId: order.id, unreadCount };
  });

  return Response.json({ totalUnread, orders: orderSummaries });
}
