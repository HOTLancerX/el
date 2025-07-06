// Placeholder for GET (one), PUT (update metadata), DELETE (one) Media operations
// GET /api/media/[id] - Get media item metadata by ID
// PUT /api/media/[id] - Update media item metadata (e.g., alt text, caption)
// DELETE /api/media/[id] - Delete media item (from R2 and DB)
import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest, { params }: { params: { id: string } }) { return NextResponse.json({ message: `GET media ${params.id} - Not Implemented` }, { status: 501 }); }
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) { return NextResponse.json({ message: `PUT media ${params.id} - Not Implemented` }, { status: 501 }); }
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  // TODO: Implement logic to delete file from Cloudflare R2 and then delete DB record.
  return NextResponse.json({ message: `DELETE media ${params.id} - Not Implemented` }, { status: 501 });
}
