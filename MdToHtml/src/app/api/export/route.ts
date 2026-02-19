import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import path from 'path';

const execAsync = promisify(exec);

export async function POST() {
    try {
        const rootDir = process.cwd(); // This is typically MdToHtml/
        // We need to run `npm run build` from MdToHtml/
        
        console.log('Starting export process...');
        // Ensure we run with production environment and clean context
        const { stdout, stderr } = await execAsync('npm run build', {
            cwd: rootDir,
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer
            env: {
                ...process.env,
                NODE_ENV: 'production', // Explicitly set production
            }
        });

        console.log('Build Output:', stdout);
        if (stderr) console.error('Build Errors:', stderr);

        return NextResponse.json({ success: true, message: 'Export completed successfully.' });
    } catch (error) {
        console.error('Export failed:', error);
        return NextResponse.json(
            { success: false, message: 'Export failed.', error: String(error) },
            { status: 500 }
        );
    }
}
