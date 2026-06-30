// TODO: Re-enable authentication before production
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  return NextResponse.next({ request })
}
