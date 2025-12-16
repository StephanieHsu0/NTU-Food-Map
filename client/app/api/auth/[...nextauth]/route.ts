import { handlers } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Export handlers directly - NextAuth v5 handles errors internally
export const { GET, POST } = handlers;

