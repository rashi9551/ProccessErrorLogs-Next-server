// utils/middleware/authMiddleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createClientForServer } from "@/utils/supabase/server";

export const authMiddleware = async (req: NextRequest) => {
  try {
    const supabase = await createClientForServer();
    
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Authorization header missing or invalid" },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Create a new response that continues the chain
    const response = NextResponse.next();
    
    // Set custom headers in the response
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-email', user.email || '');
    
    return response;

  } catch (err) {
    console.error("Auth middleware error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};