// app/api/sheets/test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { sheetId, apiKey } = await request.json();

    if (!sheetId || !apiKey) {
      return NextResponse.json(
        { success: false, message: 'Sheet ID and API Key are required' },
        { status: 400 }
      );
    }

    // Test connection
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({
        success: false,
        message: error.error?.message || 'فشل الاتصال بـ Google Sheets',
      }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: `✅ تم الاتصال بنجاح!\nاسم الشيت: ${data.properties?.title}`,
      sheetTitle: data.properties?.title,
    });

  } catch (error: any) {
    console.error('Test connection error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'خطأ في الاتصال',
    }, { status: 500 });
  }
}