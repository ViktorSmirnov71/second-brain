import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Second Brain, an AI assistant for personal knowledge management. You help users capture, organize, and retrieve information through natural conversation.

Your personality: helpful, proactive, concise. You speak conversationally and naturally.

You have access to tools for managing the user's data:
- create_person: Add a new contact to the CRM
- update_person: Update an existing contact
- add_note_on_person: Add a timestamped observation about someone
- delete_person: Remove a contact
- create_note: Create a new note in a section
- update_note: Update an existing note
- delete_note: Remove a note
- create_task: Add a new task/todo
- create_roadmap: Create a project roadmap
- ask_clarification: Ask the user for more details
- draft_content: Draft longer content for review

Content routing rules:
- Philosophy or life lesson → Philosophies section
- Idea or concept → Ideas section
- Something to try or experiment → Things to Try section
- Project, page, or detailed content → Active Projects section

Always be concise in voice conversations. For text, you can be more detailed.`;

const TOOLS = [
  {
    name: "create_person",
    description: "Create a new person/contact in the CRM",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Person's full name" },
        company: { type: "string", description: "Company name" },
        email: { type: "string", description: "Email address" },
        phone: { type: "string", description: "Phone number" },
        notes: { type: "string", description: "Initial notes about this person" },
        tags: { type: "array", items: { type: "string" }, description: "Tags for categorization" },
      },
      required: ["name"],
    },
  },
  {
    name: "update_person",
    description: "Update an existing person's information",
    input_schema: {
      type: "object",
      properties: {
        person_id: { type: "string", description: "ID of the person to update" },
        name: { type: "string" },
        company: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        notes: { type: "string" },
      },
      required: ["person_id"],
    },
  },
  {
    name: "add_note_on_person",
    description: "Add a timestamped note/observation about a person",
    input_schema: {
      type: "object",
      properties: {
        person_id: { type: "string", description: "ID of the person" },
        content: { type: "string", description: "The note content" },
      },
      required: ["person_id", "content"],
    },
  },
  {
    name: "delete_person",
    description: "Delete a person from the CRM",
    input_schema: {
      type: "object",
      properties: {
        person_id: { type: "string", description: "ID of the person to delete" },
      },
      required: ["person_id"],
    },
  },
  {
    name: "create_note",
    description: "Create a new note in a section",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Note title" },
        content: { type: "string", description: "Note content (markdown supported)" },
        section_id: { type: "string", description: "Section ID to place the note in" },
        type: { type: "string", enum: ["project", "page", "idea", "philosophy", "thing"], description: "Note type" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_note",
    description: "Update an existing note",
    input_schema: {
      type: "object",
      properties: {
        note_id: { type: "string", description: "ID of the note to update" },
        title: { type: "string" },
        content: { type: "string" },
      },
      required: ["note_id"],
    },
  },
  {
    name: "delete_note",
    description: "Delete a note",
    input_schema: {
      type: "object",
      properties: {
        note_id: { type: "string", description: "ID of the note to delete" },
      },
      required: ["note_id"],
    },
  },
  {
    name: "create_task",
    description: "Create a new task/todo item",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Task title" },
        date: { type: "string", description: "Due date (ISO format)" },
        list_type: { type: "string", enum: ["current", "scheduled", "unscheduled"] },
        notes: { type: "string", description: "Additional notes" },
      },
      required: ["title"],
    },
  },
  {
    name: "create_roadmap",
    description: "Create a project roadmap with tasks",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Roadmap title" },
        description: { type: "string", description: "Roadmap description" },
        tasks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              duration: { type: "number", description: "Duration in days" },
            },
          },
        },
      },
      required: ["title"],
    },
  },
  {
    name: "ask_clarification",
    description: "Ask the user for more details before proceeding",
    input_schema: {
      type: "object",
      properties: {
        question: { type: "string", description: "The clarifying question" },
      },
      required: ["question"],
    },
  },
  {
    name: "draft_content",
    description: "Draft longer content for the user to review",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        content: { type: "string", description: "The drafted content" },
      },
      required: ["title", "content"],
    },
  },
];

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

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: "Anthropic API not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { conversationId, message, context, inputMode } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Missing message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save user message to database
    if (conversationId) {
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: message,
      });
    }

    // Load context for the AI
    let contextPrompt = "";

    try {
      const [peopleRes, sectionsRes, notesRes] = await Promise.all([
        supabase
          .from("people")
          .select("id, name, company, tags")
          .eq("user_id", user.id)
          .limit(50),
        supabase
          .from("sections")
          .select("id, name")
          .eq("user_id", user.id),
        supabase
          .from("notes")
          .select("id, title, section_id, type")
          .eq("user_id", user.id)
          .limit(100),
      ]);

      if (peopleRes.data?.length) {
        contextPrompt += `\n\nUser's contacts:\n${peopleRes.data
          .map((p) => `- ${p.name}${p.company ? ` (${p.company})` : ""} [id: ${p.id}]`)
          .join("\n")}`;
      }

      if (sectionsRes.data?.length) {
        contextPrompt += `\n\nAvailable sections:\n${sectionsRes.data
          .map((s) => `- ${s.name} [id: ${s.id}]`)
          .join("\n")}`;
      }

      if (notesRes.data?.length) {
        contextPrompt += `\n\nRecent notes:\n${notesRes.data
          .map((n) => `- ${n.title} (${n.type}) [id: ${n.id}]`)
          .join("\n")}`;
      }
    } catch (e) {
      console.error("Context loading error:", e);
    }

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [];

    // Load conversation history
    if (conversationId) {
      const { data: history } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (history) {
        for (const msg of history) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // Add current message if not already in history
    if (!messages.length || messages[messages.length - 1].content !== message) {
      messages.push({ role: "user", content: message });
    }

    // Build system prompt with voice-specific instructions if needed
    let systemPrompt = SYSTEM_PROMPT + contextPrompt;
    if (inputMode === "voice") {
      systemPrompt += "\n\nIMPORTANT: The user is speaking via voice. Respond concisely in 1-3 short sentences. Do NOT use markdown formatting (no bold, headings, bullets, code blocks). Speak naturally as if in a conversation.";
    }

    // Call Anthropic API with streaming
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        system: systemPrompt,
        tools: TOOLS,
        messages,
        stream: true,
      }),
    });

    if (!anthropicResponse.ok) {
      const errorBody = await anthropicResponse.text();
      console.error("Anthropic API error:", anthropicResponse.status, errorBody);
      return new Response(
        JSON.stringify({ error: "AI service error", details: errorBody }),
        {
          status: anthropicResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Stream the response as SSE
    const stream = new ReadableStream({
      async start(controller) {
        const reader = anthropicResponse.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";
        const toolCalls: unknown[] = [];

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const event = JSON.parse(data);

                  if (event.type === "content_block_delta") {
                    if (event.delta?.type === "text_delta") {
                      fullText += event.delta.text;
                      controller.enqueue(
                        new TextEncoder().encode(
                          `data: ${JSON.stringify({ type: "text_delta", text: event.delta.text })}\n\n`
                        )
                      );
                    } else if (event.delta?.type === "input_json_delta") {
                      controller.enqueue(
                        new TextEncoder().encode(
                          `data: ${JSON.stringify({ type: "tool_delta", json: event.delta.partial_json })}\n\n`
                        )
                      );
                    }
                  } else if (event.type === "content_block_start") {
                    if (event.content_block?.type === "tool_use") {
                      controller.enqueue(
                        new TextEncoder().encode(
                          `data: ${JSON.stringify({
                            type: "tool_start",
                            tool: {
                              id: event.content_block.id,
                              name: event.content_block.name,
                            },
                          })}\n\n`
                        )
                      );
                    }
                  } else if (event.type === "content_block_stop") {
                    // Tool block finished
                  } else if (event.type === "message_stop") {
                    // Message complete
                  }
                } catch {
                  // Skip unparseable lines
                }
              }
            }
          }

          // Send completion event
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: "done", text: fullText })}\n\n`
            )
          );

          // Save assistant message to database
          if (conversationId && fullText) {
            await supabase.from("chat_messages").insert({
              conversation_id: conversationId,
              role: "assistant",
              content: fullText,
              tool_calls: toolCalls.length > 0 ? toolCalls : null,
            });
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: "error", error: "Stream interrupted" })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
