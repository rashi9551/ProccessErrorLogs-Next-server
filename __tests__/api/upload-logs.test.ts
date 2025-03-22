import request from "supertest";
import { NextRequest } from "next/server";
import { createClientForServer } from "@/utils/supabase/server";
import { getLogProcessingQueue, calculatePriority } from "@/lib/queue";
import handler from "@/app/api/upload-logs/route";

jest.mock("@/utils/supabase/server", () => ({
  createClientForServer: jest.fn(),
}));

jest.mock("@/lib/queue", () => ({
  getLogProcessingQueue: jest.fn(),
  calculatePriority: jest.fn(),
}));

describe("Integration test for /api/upload-log-files", () => {
  let mockSupabase: any;
  let mockQueue: any;

  beforeEach(() => {
    // Mock Supabase Authentication
    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user123", email: "test@example.com" } },
          error: null,
        }),
      },
      storage: {
        from: jest.fn().mockReturnThis(),
        upload: jest.fn().mockResolvedValue({ data: { path: "test-file-path" }, error: null }),
        createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: "https://fake-url.com" }, error: null }),
      },
    };
    (createClientForServer as jest.Mock).mockResolvedValue(mockSupabase);

    // Mock BullMQ
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: "job123" }),
    };
    (getLogProcessingQueue as jest.Mock).mockReturnValue(mockQueue);
    (calculatePriority as jest.Mock).mockReturnValue(1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: "Unauthorized" } });

    const req = new NextRequest(new Request("http://localhost/api/upload-log-files", { method: "POST" }));
    const res = await handler(req);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("should return 400 if no file is uploaded", async () => {
    const req = new NextRequest(
      new Request("http://localhost/api/upload-log-files", {
        method: "POST",
        body: new FormData(),
      })
    );
    const res = await handler(req);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "No file uploaded" });
  });

  it("should upload file, enqueue job, and return 200", async () => {
    // Create a fake file
    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", file);

    const req = new NextRequest(
      new Request("http://localhost/api/upload-log-files", {
        method: "POST",
        body: formData,
      })
    );

    const res = await handler(req);

    expect(res.status).toBe(200);
    const jsonResponse = await res.json();

    expect(jsonResponse).toEqual({
      message: "File uploaded and queued for processing",
      filePath: "test-file-path",
      jobId: "job123",
    });

    expect(mockSupabase.storage.upload).toHaveBeenCalledWith(
      expect.stringContaining("user-uploads/user123/"),
      expect.any(Buffer),
      expect.objectContaining({ contentType: "text/plain", upsert: false })
    );

    expect(mockQueue.add).toHaveBeenCalledWith(
      "process-log-file",
      expect.objectContaining({
        fileUrl: "https://fake-url.com",
        userId: "user123",
        email: "test@example.com",
      }),
      expect.objectContaining({ priority: 1 })
    );
  });
});
