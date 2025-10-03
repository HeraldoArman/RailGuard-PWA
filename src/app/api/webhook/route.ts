import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { kasus, gerbong } from '@/db/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

async function analyzeImageWithOpenAI(imageData: string): Promise<string> {
  try {
    // Determine if it's a base64 string or URL
    const isBase64 = imageData.startsWith('data:image/') || !imageData.startsWith('http');
    
    const imageInput = isBase64 
      ? imageData 
      : imageData; // URL

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analisis gambar ini untuk mendeteksi kondisi kepadatan dalam gerbong kereta. Berikan deskripsi singkat dalam bahasa Indonesia tentang: 1) Jumlah penumpang yang terlihat, 2) Tingkat kepadatan, 3) Kondisi umum gerbong. Maksimal 100 kata."
            },
            {
              type: "image_url" as const,
              image_url: {
                url: imageInput,
                detail: "low" as const
              }
            }
          ]
        }
      ],
      max_tokens: 150,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || "Tidak dapat menganalisis gambar";
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    return "Gagal menganalisis gambar dengan AI";
  }
}

export async function POST(req: NextRequest) {
  try {
    const data: WebhookPayload = await req.json();
    console.log('Received webhook:', data);

    // Validate required fields
    if (!data.gerbong_id || !data.crowdness_level) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' }, 
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
        { success: false, error: 'Gerbong not found' }, 
        { status: 404 }
      );
    }

    // Process image with OpenAI if provided
    let aiDescription = "";
    if (data.image || data.image_url) {
      const imageData = data.image || data.image_url!;
      aiDescription = await analyzeImageWithOpenAI(imageData);
      console.log('AI Image Analysis:', aiDescription);
    }

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
      let description = `Terdeteksi kepadatan ${data.crowdness_level.toLowerCase()} dengan ${data.max_human_count} penumpang. Confidence: ${(data.confidence_score * 100).toFixed(1)}%`;
      
      if (aiDescription) {
        description += `\n\nAnalisis visual AI: ${aiDescription}`;
      }

      [createdCase] = await db
        .insert(kasus)
        .values({
          name: caseName,
          description: description,
          caseType: caseType,
          source: "ml", // Machine Learning detection
          occupancyLabel: occupancyLabel,
          occupancyValue: data.max_human_count,
          gerbongId: data.gerbong_id,
          status: "belum_ditangani",
          deskripsiKasus: aiDescription || null,
        })
        .returning();

      console.log('Created new crowdness case:', createdCase);
    }

    // Respond with success
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      data: {
        gerbong_updated: true,
        case_created: !!createdCase,
        case_id: createdCase?.id,
        occupancy_level: occupancyLabel,
        ai_analysis: aiDescription || null,
      }
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}