import fs from 'fs';
import path from 'path';
import PathManager from './path-manager';

export async function collectData(slug: string, newContent: string, operations?: any[]) {
    try {
        const dataPath = PathManager.getDataPath();
        
        // Use dataPath directly as the root for training data
        const trainingDir = dataPath; 
        
        if (!fs.existsSync(trainingDir)) {
            fs.mkdirSync(trainingDir, { recursive: true });
        }

        const safeSlug = slug.replace(/[^a-zA-Z0-9\-\u4e00-\u9fa5\s_.\(\)]/g, '');
        const docDir = path.join(trainingDir, safeSlug);

        if (!fs.existsSync(docDir)) {
            fs.mkdirSync(docDir, { recursive: true });
        }

        const initialFile = path.join(docDir, 'initial.md');
        const historyFile = path.join(docDir, 'history.jsonl');

        // Handle Initial Document
        if (!fs.existsSync(initialFile)) {
            const inputDir = PathManager.getInputPath();
            const filename = safeSlug.endsWith('.md') ? safeSlug : `${safeSlug}.md`;
            const sourcePath = path.join(inputDir, filename);

            let initialContent = newContent;
            
            if (fs.existsSync(sourcePath)) {
                initialContent = fs.readFileSync(sourcePath, 'utf8');
            }
            
            fs.writeFileSync(initialFile, initialContent, 'utf8');
        }

        // Handle History (Smart Incremental Save)
        // 1. Check previous entry to avoid redundancy
        let lastContent = null;
        if (fs.existsSync(historyFile)) {
            const lines = fs.readFileSync(historyFile, 'utf8').trim().split('\n');
            if (lines.length > 0) {
                try {
                    const lastEntry = JSON.parse(lines[lines.length - 1]);
                    lastContent = lastEntry.content; // Might be null if it was an op-only entry
                    
                    // If last entry was op-only, we need to reconstruct state or check if content changed
                    // For simplicity: If content is provided and identical to current input, we skip saving content
                    // But we don't have easy access to "current state on disk" here except reading file again.
                    // Let's assume newContent is the Source of Truth.
                } catch (e) {
                    // Ignore parse error
                }
            }
        } else {
             // If history empty, check initial.md
             if (fs.existsSync(initialFile)) {
                 lastContent = fs.readFileSync(initialFile, 'utf8');
             }
        }

        const timestamp = Date.now();
        let entryType = 'unknown';
        let shouldSaveContent = true;

        // Decision Logic:
        // A. If operations exist -> It's a layout/structure change.
        //    We save operations. We DO NOT save content to save space, 
        //    UNLESS we want to be safe. User hates redundancy.
        //    So: Save operations, skip content.
        
        // B. If no operations -> It's a text edit (or operations not captured).
        //    We must check if content actually changed.
        
        if (operations && operations.length > 0) {
            entryType = 'layout_operation';
            shouldSaveContent = false; // Trust operations to describe the change
        } else {
            entryType = 'content_edit';
            if (lastContent === newContent) {
                // No change, skip
                console.log(`[DataCollector] Content identical, skipping save for ${safeSlug}`);
                return;
            }
        }

        const historyEntry: any = {
            timestamp,
            type: entryType
        };

        if (shouldSaveContent) {
            historyEntry.content = newContent;
        }

        if (operations && operations.length > 0) {
            historyEntry.operations = operations;
        }

        fs.appendFileSync(historyFile, JSON.stringify(historyEntry) + '\n', 'utf8');
        console.log(`[DataCollector] Collected data for ${safeSlug} (Type: ${entryType})`);
        
    } catch (error) {
        console.error('[DataCollector] Failed to collect data:', error);
    }
}
