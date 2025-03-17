import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "buffer";
import { createClientForServer } from "@/utils/supabase/server";
import { getLogProcessingQueue } from "@/lib/queue";
import calculatePriority from "@/utils/calculatePriority";



export async function POST(req: NextRequest) {
  try {
    const logProcessingQueue= getLogProcessingQueue()
    const supabase = await createClientForServer();
    
    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Supabase storage upload
    const storagePath = `user-uploads/${user.id}/${Date.now()}-${file.name}`;
    console.log(`Uploading file to: ${storagePath}`);
    
    const { data: storageData, error: storageError } = await supabase.storage
      .from("log-files")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (storageError) {
      throw new Error(`Storage upload failed: ${storageError.message}`);
    }

    // Get a URL for the uploaded file
    const { data: urlData } = await supabase.storage
      .from("log-files")
      .createSignedUrl(storagePath, 60 * 60); // 1 hour expiry

    const fileUrl = urlData?.signedUrl;
    
    if (!fileUrl) {
      throw new Error("Failed to get signed URL for uploaded file");
    }

    // Add job to BullMQ queue
    const job = await logProcessingQueue.add(
      "process-log-file", 
      {
        fileUrl,
        storagePath,
        bucketName: "log-files",
        originalFilename: file.name,
        userId: user.id,
        email: user.email,
        fileSize: file.size // Add file size to use for priority
      },
      {
        priority: calculatePriority(file.size), // Lower size = higher priority
        attempts: 3, // Set retry limit to 3
        backoff: {
          type: 'exponential',
          delay: 5000 // Start with 5s delay, then exponential backoff
        }
      }
    );

    console.log(`Added job ${job.id} to queue for processing ${file.name}`);
    // logProcessingQueue.drain() to delete all jobs 
    return NextResponse.json(
      { 
        message: "File uploaded and queued for processing", 
        filePath: storageData.path,
        jobId: job.id
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}