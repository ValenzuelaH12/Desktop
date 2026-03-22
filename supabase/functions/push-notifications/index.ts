// @ts-ignore: Deno types
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import webpush from "https://esm.sh/web-push@3.6.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Manejar CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // El Trigger de la DB pasará el body con los datos de la notificación
    const payload = await req.json();
    const { record } = payload; // 'record' contiene la fila insertada en 'notificaciones'

    if (!record || !record.user_id) {
      throw new Error("No record or user_id found in payload");
    }

    // 1. Buscar las suscripciones del usuario
    const { data: subscriptions, error: subError } = await supabaseClient
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", record.user_id);

    if (subError) throw subError;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "No active subscriptions for user" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 2. Configurar VAPID
    const publicVapidKey = "BL9KSv9l2_Zf9Of0xfdUQY9t5UiBX22Vc8cRDXV24hlK-dZOCJHf0t3al4oe8rDoFNp8kW3FccOqRKRjblw4I-k";
    const privateVapidKey = "PMiFIDdPTJco42NMOqgehK-R7iDrAKPm_CT-EF0-FKk";

    webpush.setVapidDetails(
      "mailto:soporte@vsuite.dev",
      publicVapidKey,
      privateVapidKey
    );

    // 3. Preparar el contenido de la notificación
    const pushPayload = JSON.stringify({
      title: record.title || "V-Suite Alerta",
      body: record.message || "Nueva notificación del sistema",
      icon: "/pwa-192x192.png",
      badge: "/favicon.svg",
      data: { 
        url: record.link || "/incidencias",
        type: record.type
      }
    });

    // 4. Enviar a todos los dispositivos registrados del usuario
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, pushPayload);
      } catch (err) {
        // Si el token es inválido o expiró (410 Gone / 404), limpiamos la DB
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Eliminando suscripción inválida para usuario ${record.user_id}`);
          await supabaseClient
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
        } else {
          console.error("Error enviando push:", err);
        }
      }
    });

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error en Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
