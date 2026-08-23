import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 모듈 로드 시점에 createClient(undefined!, undefined!) 를 호출하면
// 환경변수가 없는 빌드/CI 에서 import 만으로 프로세스가 죽습니다.
// redis / resend 와 동일하게, 설정이 있을 때만 클라이언트를 만들고
// 호출부가 null 을 처리하도록 합니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;
