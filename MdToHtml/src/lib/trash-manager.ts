import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import PathManager from './path-manager';
import { TrashStats, TrashItem } from '../types/file-system';
import { DEFAULT_CAPACITY, TRASH_DIR_NAME } from './constants';

class TrashManager {
    private static instance: TrashManager;

    private constructor() {
        this.ensureTrashDir();
    }

    public static getInstance(): TrashManager {
        if (!TrashManager.instance) {
            TrashManager.instance = new TrashManager();
        }
        return TrashManager.instance;
    }

    public reload() {
        this.ensureTrashDir();
    }

    private get trashDir(): string {
        return PathManager.getRecyclePath();
    }

    private ensureTrashDir() {
        if (!fs.existsSync(this.trashDir)) {
            try {
                fs.mkdirSync(this.trashDir, { recursive: true });
            } catch (error) {
                console.error(`[TrashManager] Failed to create trash directory: ${this.trashDir}`, error);
            }
        }
    }

    /**
     * Move files to trash with timestamp to prevent conflicts and track deletion time.
     * @param files Array of absolute paths or filenames (relative to input dir)
     */
    public moveToTrash(files: string[]): { success: number, failed: number, errors: string[] } {
        let success = 0;
        let failed = 0;
        const errors: string[] = [];
        const inputDir = PathManager.getInputPath();

        this.ensureTrashDir();

        files.forEach(file => {
            try {
                let fullPath = file;
                // If not absolute, assume it's in inputDir
                if (!path.isAbsolute(file)) {
                    fullPath = path.join(inputDir, file);
                }

                if (!fs.existsSync(fullPath)) {
                    // Try checking if it's already just a filename in inputDir
                    // (Already covered by logic above if file was just "foo.md")
                    
                    // Warn and skip
                    errors.push(`File not found: ${file}`);
                    failed++;
                    return;
                }

                const filename = path.basename(fullPath);
                const ext = path.extname(filename);
                const name = path.basename(filename, ext);
                const timestamp = Date.now();
                // Format: filename_timestamp.md
                const trashFilename = `${name}_${timestamp}${ext}`;
                const trashPath = path.join(this.trashDir, trashFilename);

                fs.renameSync(fullPath, trashPath);
                success++;
                
                // Notify CacheManager to remove from cache
                // We pass the basename because CacheManager maps by basename
                // Using 'delete' might trigger infinite loop if it calls moveToTrash back.
                // So we need a way to just remove from cache without moving to trash.
                // MetadataCacheManager.delete() calls moveToTrash.
                // We should probably have a 'removeFromCache' method or update MetadataCacheManager to use TrashManager only for 'capacity cleanup' or 'explicit delete'
                // If this method is called FROM MetadataCacheManager, we don't need to call back.
                
                // Ideally, TrashManager handles FS ops, and CacheManager observes FS or is told to update.
                // For now, we assume the caller handles cache update if needed, OR we call a "sync" method.
                
            } catch (error: any) {
                failed++;
                errors.push(`Failed to move ${file}: ${error.message}`);
            }
        });

        // Auto-cleanup if exceeds limit
        this.cleanupOldFiles(DEFAULT_CAPACITY);

        return { success, failed, errors };
    }

    private cleanupOldFiles(limit: number = DEFAULT_CAPACITY) {
        try {
            const files = this.getFiles();
            if (files.length <= limit) return;
            
            console.log(`[TrashManager] Auto-cleanup triggered. Count: ${files.length}, Limit: ${limit}`);

            // Sort by deletedAt ascending (oldest first)
            files.sort((a, b) => a.deletedAt - b.deletedAt);

            const toDelete = files.slice(0, files.length - limit);
            toDelete.forEach(file => {
                try {
                    fs.unlinkSync(path.join(this.trashDir, file.name));
                    console.log(`[TrashManager] Auto-deleted old file: ${file.name}`);
                } catch (e) {
                    console.error(`[TrashManager] Failed to auto-cleanup ${file.name}`, e);
                }
            });
        } catch (e) {
            console.error('[TrashManager] Auto-cleanup failed', e);
        }
    }

    public emptyTrash(): void {
        this.ensureTrashDir();
        if (fs.existsSync(this.trashDir)) {
            const files = fs.readdirSync(this.trashDir);
            for (const file of files) {
                try {
                    fs.unlinkSync(path.join(this.trashDir, file));
                } catch (e) {
                    console.error(`[TrashManager] Failed to delete ${file} from trash`, e);
                }
            }
        }
    }

    public getStats(): TrashStats {
        let count = 0;
        let size = 0;

        this.ensureTrashDir();
        
        if (fs.existsSync(this.trashDir)) {
            try {
                const files = fs.readdirSync(this.trashDir);
                count = files.length;
                for (const file of files) {
                    try {
                        const stats = fs.statSync(path.join(this.trashDir, file));
                        size += stats.size;
                    } catch (e) {
                        // Ignore
                    }
                }
            } catch (e) {
                console.error('[TrashManager] Failed to read trash stats', e);
            }
        }

        return { count, size };
    }

    public getFiles(): TrashItem[] {
        this.ensureTrashDir();
        if (!fs.existsSync(this.trashDir)) return [];

        try {
            const files = fs.readdirSync(this.trashDir);
            return files.map(file => {
                try {
                    const fullPath = path.join(this.trashDir, file);
                    const stats = fs.statSync(fullPath);
                    
                    // Parse filename: name_timestamp.ext
                    const lastUnderscore = file.lastIndexOf('_');
                    const ext = path.extname(file);
                    
                    let originalName = file;
                    let deletedAt = stats.mtimeMs; // Fallback to file mtime

                    if (lastUnderscore > 0) {
                        const timestampPart = file.substring(lastUnderscore + 1, file.length - ext.length);
                        const namePart = file.substring(0, lastUnderscore);
                        const ts = parseInt(timestampPart);
                        if (!isNaN(ts)) {
                            deletedAt = ts;
                            originalName = namePart + ext;
                        }
                    }

                    return {
                        name: file, // Physical filename in trash
                        originalName,
                        size: stats.size,
                        deletedAt
                    };
                } catch (e) {
                    return null;
                }
            }).filter(f => f !== null) as TrashItem[];
        } catch (e) {
            console.error('[TrashManager] Failed to list trash files', e);
            return [];
        }
    }

    public restoreFiles(files: string[]): { success: number; failed: number; errors: string[] } {
        let success = 0;
        let failed = 0;
        const errors: string[] = [];
        const inputDir = PathManager.getInputPath();

        this.ensureTrashDir();

        files.forEach(file => {
            try {
                const trashPath = path.join(this.trashDir, file);
                if (!fs.existsSync(trashPath)) {
                    errors.push(`File not found in trash: ${file}`);
                    failed++;
                    return;
                }

                // Parse original name
                const lastUnderscore = file.lastIndexOf('_');
                const ext = path.extname(file);
                let originalName = file;
                
                if (lastUnderscore > 0) {
                    const timestampPart = file.substring(lastUnderscore + 1, file.length - ext.length);
                    const namePart = file.substring(0, lastUnderscore);
                    if (!isNaN(parseInt(timestampPart))) {
                        originalName = namePart + ext;
                    }
                }

                let targetPath = path.join(inputDir, originalName);

                // Handle conflict
                if (fs.existsSync(targetPath)) {
                    const name = path.basename(originalName, ext);
                    targetPath = path.join(inputDir, `${name}_restored_${Date.now()}${ext}`);
                }

                // Use copy + unlink instead of rename to ensure new birthtime (creation time)
                // This ensures the restored file appears at the top when sorted by "Import Time"
                fs.copyFileSync(trashPath, targetPath);
                fs.unlinkSync(trashPath);
                
                // Explicitly update mtime/atime to now to ensure it appears at top when sorted by "Modified Time"
                const now = new Date();
                fs.utimesSync(targetPath, now, now);

                // Windows Tunneling Fix: Force update CreationTime (birthtime) via PowerShell
                // This ensures it appears at top when sorted by "Import Time" (default)
                if (process.platform === 'win32') {
                    try {
                        // Use powershell to update CreationTime
                        const cmd = `powershell -Command "(Get-Item '${targetPath}').CreationTime = Get-Date"`;
                        execSync(cmd, { stdio: 'ignore' });
                    } catch (e) {
                        console.error('[TrashManager] Failed to update creation time on Windows', e);
                    }
                }
                
                success++;
            } catch (error: any) {
                failed++;
                errors.push(`Failed to restore ${file}: ${error.message}`);
            }
        });

        return { success, failed, errors };
    }

    public deleteFiles(files: string[]): { success: number; failed: number; errors: string[] } {
        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        this.ensureTrashDir();

        files.forEach(file => {
            try {
                const trashPath = path.join(this.trashDir, file);
                if (fs.existsSync(trashPath)) {
                    fs.unlinkSync(trashPath);
                    success++;
                } else {
                    errors.push(`File not found: ${file}`);
                    failed++;
                }
            } catch (error: any) {
                failed++;
                errors.push(`Failed to delete ${file}: ${error.message}`);
            }
        });

        return { success, failed, errors };
    }
}

export default TrashManager.getInstance();
