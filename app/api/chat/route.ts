import { NextResponse } from "next/server";

/**
 * ============================================================================
 * TEMPORARY / SAMPLE AREA: DIRECT OPENAI INTEGRATION
 * ============================================================================
 * This route is a temporary proxy to OpenAI's GPT-3.5 Turbo model.
 * In the future, this will be removed and replaced with a custom-trained 
 * AgroSphere model or a more sophisticated backend service.
 * ============================================================================
 */

export async function POST(request: Request) {
  const { messages } = await request.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === "your_openai_api_key_here") {
    return NextResponse.json(
      { error: "OpenAI API key is missing. Please set it in .env.local" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are AgroSphere AI, a professional agricultural assistant. You help farmers with crop diagnosis, pesticide recommendations, and smart farming advice. Be professional, concise, and helpful.",
          },
          ...messages,
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "OpenAI API error");
    }

    return NextResponse.json({
      text: data.choices[0].message.content,
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
