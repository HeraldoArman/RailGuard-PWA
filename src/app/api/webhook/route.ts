import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { kasus, gerbong } from "@/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prompt = `kamu adalah seorang asisten yang membantu satpam krl untuk mengjaga keamanan, ketertiban, dan keramaian di krl.
analisis gambar kamera keamanan kereta ini. Berikan deskripsi singkat dalam bahasa Indonesia (2-3 kalimat saja) tentang: 1) Perkiraan jumlah penumpang, 2) Tingkat kepadatan (kosong/sedang/padat), 3) Kondisi umum gerbong.
Fokus pada kepadatan penumpang atau anomali lainnya. Untuk beberapa hal umum seperti papan iklan diabaikan saja. Buat dalam bentuk 2 sampai 3 kalimat saja, jangan dalam bentuk poin.
Sebagai konteks tambahan. `;

interface WebhookPayload {
  gerbong_id: string;
  max_human_count: number;
  confidence_score: number;
  crowdness_level: "Low Density" | "Medium Density" | "High Density";
  performance: {
    total_inference_seconds: number;
    average_inference_ms: number;
    average_fps: number;
  };
  image?: string; // Base64 encoded image or image URL
  image_url?: string; // Alternative: direct image URL
}

async function analyzeImageWithOpenAI(imageData: string, gerbongId: string): Promise<string> {
  try {
    console.log("Processing image data:", imageData.substring(0, 100)); // Log first 100 chars for debugging

    // Determine if it's a base64 string or URL
    const isBase64 =
      imageData.startsWith("data:image/") ||
      (!imageData.startsWith("http") && !imageData.startsWith("https"));

    let imageInput = imageData;

    // Ensure proper base64 format
    if (isBase64 && !imageData.startsWith("data:image/")) {
      // If it's base64 but missing the data URI prefix, add it
      imageInput = `data:image/jpeg;base64,${imageData}`;
    }

    console.log("Image input format:", isBase64 ? "base64" : "URL");
    console.log("Image input preview:", imageInput.substring(0, 50));

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use gpt-4o instead of gpt-4o-mini for better vision capabilities
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${prompt}`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageInput,
                detail: "high", // Use high detail for better analysis
              },
            },
          ],
        },
      ],
      max_tokens: 200,
      temperature: 0.1, // Lower temperature for more consistent responses
    });

    const result =
      response.choices[0]?.message?.content ||
      "Tidak dapat menganalisis gambar";
    console.log("OpenAI response:", result);
    return result;
  } catch (error) {
    console.error("OpenAI analysis error:", error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return "Gagal menganalisis gambar dengan AI";
  }
}

export async function POST(req: NextRequest) {
  try {
    const data: WebhookPayload = await req.json();
    console.log("Received webhook:", {
      ...data,
      image: data.image
        ? `[Base64 data - ${data.image.length} chars]`
        : undefined,
      image_url: data.image_url,
    });

    // Validate required fields
    if (!data.gerbong_id || !data.crowdness_level) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if gerbong exists
    const [existingGerbong] = await db
      .select()
      .from(gerbong)
      .where(eq(gerbong.id, data.gerbong_id))
      .limit(1);

    if (!existingGerbong) {
      return NextResponse.json(
        { success: false, error: "Gerbong not found" },
        { status: 404 }
      );
    }

    // Process image with OpenAI if provided
    let aiDescription = "";
    if (data.image || data.image_url) {
      const imageData = data.image || data.image_url!;

      // Validate base64 format if it's base64
      if (
        data.image &&
        !data.image.startsWith("data:image/") &&
        !data.image.startsWith("http")
      ) {
        // Check if it's valid base64
        try {
          atob(data.image.replace(/\s/g, ""));
        } catch (e) {
          console.error("Invalid base64 format");
          return NextResponse.json(
            { success: false, error: "Invalid base64 image format" },
            { status: 400 }
          );
        }
      }

      aiDescription = await analyzeImageWithOpenAI(imageData, data.gerbong_id);
      console.log("AI Image Analysis:", aiDescription);
    }

    // ...existing code...
    // Determine case type and status based on crowdness level
    let caseType: "kepadatan" | null = null;
    let occupancyLabel: "longgar" | "sedang" | "padat" | null = null;
    let shouldCreateCase = false;

    switch (data.crowdness_level) {
      case "Low Density":
        occupancyLabel = "longgar";
        break;
      case "Medium Density":
        occupancyLabel = "sedang";
        // Create case for medium density if confidence is high
        if (data.confidence_score > 0.7) {
          caseType = "kepadatan";
          shouldCreateCase = true;
        }
        break;
      case "High Density":
        occupancyLabel = "padat";
        caseType = "kepadatan";
        shouldCreateCase = true;
        break;
    }

    // Update gerbong status
    await db
      .update(gerbong)
      .set({
        statusKepadatan: occupancyLabel,
        totalPenumpang: data.max_human_count,
        adaKasus: shouldCreateCase,
        updatedAt: new Date(),
        deskripsi: aiDescription || null,
      })
      .where(eq(gerbong.id, data.gerbong_id));

    let createdCase = null;

    // Create case if crowdness level requires attention
    if (shouldCreateCase && caseType) {
      const caseName = `Kepadatan ${data.crowdness_level} - ${data.max_human_count} penumpang`;

      // Combine AI analysis with detection data
      // let description = `Terdeteksi kepadatan ${data.crowdness_level.toLowerCase()} dengan ${data.max_human_count} penumpang. Confidence: ${(data.confidence_score * 100).toFixed(1)}%`;

      // if (aiDescription) {
      //   description += `\n\nAnalisis visual AI: ${aiDescription}`;
      // }

      [createdCase] = await db
        .insert(kasus)
        .values({
          name: caseName,
          description: aiDescription,
          caseType: caseType,
          source: "ml", // Machine Learning detection
          occupancyLabel: occupancyLabel,
          occupancyValue: data.max_human_count,
          gerbongId: data.gerbong_id,
          status: "belum_ditangani",
          deskripsiKasus: aiDescription || null,
        })
        .returning();

      console.log("Created new crowdness case:", createdCase);
    }

    // Respond with success
    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      data: {
        gerbong_updated: true,
        case_created: !!createdCase,
        case_id: createdCase?.id,
        occupancy_level: occupancyLabel,
        ai_analysis: aiDescription || null,
      },
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
