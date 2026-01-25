import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
// We need SERVICE_ROLE_KEY to upload reliably and create bucket if missing
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    const bucketName = 'haraj-images';
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    // Sanitize filename: remove special chars, keep extension
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '-');
    const filename = `${Date.now()}-${cleanName}`;

    // 1. Try to upload
    let { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from(bucketName)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false
      });

    // 2. If bucket doesn't exist, create it and retry
    // Note: 'bucket not found' error message may vary, checking broadly or just failing over
    if (uploadError && (uploadError.message.includes('bucket') || uploadError.message.includes('not found'))) {
      console.log("Bucket might be missing, attempting to create...");
      
      const { error: createError } = await supabaseAdmin
        .storage
        .createBucket(bucketName, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
        });
      
      if (createError && !createError.message.includes('already exists')) {
        console.error("Failed to create bucket:", createError);
        // Don't throw yet, maybe it existed but something else failed
      }

      // Retry upload
      const retry = await supabaseAdmin
        .storage
        .from(bucketName)
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: false
        });
      
      uploadData = retry.data;
      uploadError = retry.error;
    }

    if (uploadError) {
      console.error("Supabase Upload Error:", uploadError);
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    // 3. Get Public URL
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from(bucketName)
      .getPublicUrl(filename);

    return NextResponse.json({ success: true, url: publicUrl });

  } catch (error) {
    console.error("Upload fatal error:", error);
    return NextResponse.json({ success: false, error: "Internal Upload Failed" }, { status: 500 });
  }
}
