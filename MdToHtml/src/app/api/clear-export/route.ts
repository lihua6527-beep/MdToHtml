import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PathManager from '@/lib/path-manager';

export async function POST(request: NextRequest) {
  try {
    const outputDir = PathManager.getOutputPath();
    if (!fs.existsSync(outputDir)) {
      return NextResponse.json({ count: 0 });
    }

    let count = 0;
    
    // Recursive function to delete files in directory and subdirectories
    const deleteExportFiles = (dir: string) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          // Recursively process subdirectory
          deleteExportFiles(filePath);
        } else if (file.endsWith('.html') || file.endsWith('.json')) {
          // Delete HTML and JSON files
          fs.unlinkSync(filePath);
          count++;
          console.log(`[Clear Export] Deleted: ${filePath}`);
        }
      }
    };

    // Start deleting from output directory
    deleteExportFiles(outputDir);

    console.log(`[Clear Export] Total deleted: ${count} files`);
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error clearing export files:', error);
    return NextResponse.json(
      { error: 'Failed to clear export files' },
      { status: 500 }
    );
  }
}
