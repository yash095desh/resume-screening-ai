import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("Received webhook request");

    // Step 1: Verify webhook
    let evt;
    try {
      evt = await verifyWebhook(req);
      console.log("Webhook verified successfully:", evt.type);
    } catch (verifyErr) {
      console.error("Webhook verification failed:", verifyErr);
      throw verifyErr;
    }

    const { type, data } = evt;
    console.log("Webhook event type:", type);
    console.log("Webhook data:", JSON.stringify(data, null, 2));

    // Step 2: Handle user.created
    if (type === "user.created") {
      console.log("Processing user.created for ID:", data.id);
      try {
        await prisma.user.upsert({
          where: { id: data.id },
          create: {
            id: data.id,
            email: data.email_addresses?.[0]?.email_address,
            name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
          },
          update: {},
        });
        console.log(
          "User created in database:",
          data.email_addresses?.[0]?.email_address
        );
      } catch (dbErr) {
        console.error("Prisma upsert failed for user.created:", dbErr);
        throw dbErr;
      }
    }

    // Step 3: Handle user.updated
    if (type === "user.updated") {
      console.log("Processing user.updated for ID:", data.id);
      try {
        await prisma.user.update({
          where: { id: data.id },
          data: {
            email: data.email_addresses?.[0]?.email_address,
            name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
          },
        });
        console.log(
          "User updated in database:",
          data.email_addresses?.[0]?.email_address
        );
      } catch (dbErr) {
        console.error("Prisma update failed for user.updated:", dbErr);
        throw dbErr;
      }
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return new Response("Error processing webhook", { status: 400 });
  }
}