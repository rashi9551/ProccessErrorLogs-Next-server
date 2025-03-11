'use client'

import { createBrowserClient } from '@supabase/ssr'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const createClientForBrowser = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
  )

export default createClientForBrowser