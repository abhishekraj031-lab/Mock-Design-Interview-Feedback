export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json({ hasServerKey: !!process.env.ANTHROPIC_API_KEY });
}
