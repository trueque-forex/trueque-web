export const config = {
  runtime: 'edge'
}

export default async function handler(req: Request): Promise<Response> {
  return new Response(JSON.stringify({ message: '✅ edge test route reached' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
