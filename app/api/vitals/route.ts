
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { evaluateVitals } from "@/lib/health-rules";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("vital_readings")
    .select("*")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to fetch readings:", error.message);

    return NextResponse.json(
      { error: "Could not fetch readings" },
      { status: 500 }
    );
  }

  return NextResponse.json({ readings: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const heartRate = body.heartRate;
    const spo2 = body.spo2;
    const temperatureC = body.temperatureC;

    if (
      !Number.isInteger(heartRate) ||
      heartRate < 1 ||
      heartRate > 300 ||
      typeof spo2 !== "number" ||
      !Number.isFinite(spo2) ||
      spo2 < 0 ||
      spo2 > 100 ||
      typeof temperatureC !== "number" ||
      !Number.isFinite(temperatureC) ||
      temperatureC < 20 ||
      temperatureC > 50
    ) {
      return NextResponse.json(
        { error: "Invalid vital reading values" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("vital_readings")
      .insert({
        user_id: user.id,
        heart_rate: heartRate,
        spo2,
        temperature_c: temperatureC,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to save reading:", error.message);

      return NextResponse.json(
        { error: "Could not save reading" },
        { status: 500 }
      );
    }
// Evaluate the newly saved reading.

    // Evaluate the newly saved reading.
    const insights = evaluateVitals({
      id: data.id,
      heart_rate: data.heart_rate,
      spo2: data.spo2,
      temperature_c: data.temperature_c,
      recorded_at: data.recorded_at,
    });

    // Save every insight generated for this reading.
    const savedInsights = [];
    const insightErrors = [];

    for (const insight of insights) {
      const {
        data: savedInsight,
        error: insightError,
      } = await supabase
        .from("health_insights")
        .insert({
          user_id: user.id,
          reading_id: data.id,
          ...insight,
        })
        .select()
        .single();

      if (insightError) {
        console.error(
          "Failed to save health insight:",
          insightError.code,
          insightError.message
        );

        insightErrors.push({
          rule_key: insight.rule_key,
          code: insightError.code,
          error: insightError.message,
        });

        continue;
      }

      if (savedInsight) {
        savedInsights.push(savedInsight);
      }
    }

    return NextResponse.json(
      {
        reading: data,
        insights: savedInsights,
        insightErrors,
      },
      { status: 201 }
    );

  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
