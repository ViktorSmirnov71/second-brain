import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deepgramKey = Deno.env.get("DEEPGRAM_API_KEY");
    if (!deepgramKey) {
      return new Response(JSON.stringify({ error: "Deepgram not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a scoped temporary key via Deepgram API
    const keyResponse = await fetch("https://api.deepgram.com/v1/projects", {
      headers: { Authorization: `Token ${deepgramKey}` },
    });

    if (!keyResponse.ok) {
      // Fallback: return pre-authenticated WebSocket URL directly
      const params = new URLSearchParams({
        model: "nova-2",
        language: "en",
        smart_format: "true",
        interim_results: "true",
        endpointing: "300",
        utterance_end_ms: "1000",
        encoding: "linear16",
        sample_rate: "16000",
        channels: "1",
      });

      const websocketUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;

      return new Response(
        JSON.stringify({ websocketUrl, apiKey: deepgramKey }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const projects = await keyResponse.json();
    const projectId = projects.projects?.[0]?.project_id;

    if (!projectId) {
      // Fallback if no project found
      const params = new URLSearchParams({
        model: "nova-2",
        language: "en",
        smart_format: "true",
        interim_results: "true",
        endpointing: "300",
        utterance_end_ms: "1000",
        encoding: "linear16",
        sample_rate: "16000",
        channels: "1",
      });

      return new Response(
        JSON.stringify({
          websocketUrl: `wss://api.deepgram.com/v1/listen?${params.toString()}`,
          apiKey: deepgramKey,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create a temporary scoped key (expires in 10 seconds)
    const scopedKeyResponse = await fetch(
      `https://api.deepgram.com/v1/projects/${projectId}/keys`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${deepgramKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: "Temporary STT key",
          scopes: ["usage:write"],
          time_to_live_in_seconds: 10,
        }),
      }
    );

    if (!scopedKeyResponse.ok) {
      // Fallback to direct key
      const params = new URLSearchParams({
        model: "nova-2",
        language: "en",
        smart_format: "true",
        interim_results: "true",
        endpointing: "300",
        utterance_end_ms: "1000",
        encoding: "linear16",
        sample_rate: "16000",
        channels: "1",
      });

      return new Response(
        JSON.stringify({
          websocketUrl: `wss://api.deepgram.com/v1/listen?${params.toString()}`,
          apiKey: deepgramKey,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const scopedKey = await scopedKeyResponse.json();
    const tempKey = scopedKey.key;

    const params = new URLSearchParams({
      model: "nova-2",
      language: "en",
      smart_format: "true",
      interim_results: "true",
      endpointing: "300",
      utterance_end_ms: "1000",
      encoding: "linear16",
      sample_rate: "16000",
      channels: "1",
    });

    const websocketUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;

    return new Response(
      JSON.stringify({ websocketUrl, apiKey: tempKey }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("STT token error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate STT token" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
