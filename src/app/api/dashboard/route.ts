import { NextRequest, NextResponse } from "next/server";
import { createClientForServer } from "@/utils/supabase/server";
import { authMiddleware } from "@/utils/middleware/authMiddleware";

export const dynamic = 'force-dynamic'; // Ensure fresh data on each request

export async function GET(req: NextRequest) {
  try {
    const supabase =await createClientForServer();
    
    // Verify user session (optional but recommended)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const authResult = await authMiddleware(req);
      
    // If authResult is not NextResponse.next(), it means authentication failed
    if (!(authResult instanceof NextResponse) || authResult.status !== 200) {
        return authResult;
    } 
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch recent jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('job_status')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (jobsError) {
      return NextResponse.json(
        { error: jobsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(jobs);

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}