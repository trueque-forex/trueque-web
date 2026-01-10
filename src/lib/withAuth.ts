// src/lib/withAuth.ts
import type {
  NextApiHandler,
  NextApiRequest,
  NextApiResponse,
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from 'next';
import { parseSessionFromReq } from './serverAuth';
import { TruequeSession } from '../types/auth';

type SSRHandler<P = any> = (
  ctx: GetServerSidePropsContext & { session?: any }
) => Promise<GetServerSidePropsResult<P>>;

export function withAuth(handler: NextApiHandler): NextApiHandler;
export function withAuth<P extends Record<string, any> = Record<string, any>>(handler: SSRHandler<P>): GetServerSideProps<P>;
export function withAuth(handler: any): any {
  return async function wrapped(contextOrReq: any, maybeRes?: any) {
    const isApiRoute = typeof maybeRes !== 'undefined';
    const req: NextApiRequest = isApiRoute ? contextOrReq : contextOrReq.req;
    const res: NextApiResponse = isApiRoute ? maybeRes : contextOrReq.res;

    const session = await parseSessionFromReq(req);

    // STICT API GUARD
    // 1. Validate standardized structure
    if (!session || !session.user || typeof session.user.id !== 'string') {
      if (isApiRoute) {
        res.status(401).json({ error: 'unauthenticated' });
        return;
      } else {
        return {
          redirect: {
            destination: '/signin',
            permanent: false,
          },
        } as GetServerSidePropsResult<any>;
      }
    }

    // 2. FAILSAVE: Reject Legacy Keys to prevent drift
    // Use type assertion to check for hidden properties not in TruequeSession type
    if ((session as any).userId) {
      console.error('[API GUARD] Legacy "userId" detected on session. Request blocked to prevent drift.');
      if (isApiRoute) {
        res.status(401).json({ error: 'legacy_property_drift_detected' });
        return;
      }
    }

    if (isApiRoute) {
      (req as any).session = session as TruequeSession;
      return handler(contextOrReq, maybeRes);
    } else {
      // For SSR handler: attach session to ctx and call handler
      const ctxWithSession = { ...contextOrReq, session };
      return handler(ctxWithSession);
    }
  };
}