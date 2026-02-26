import fs from 'fs';
import path from 'path';
import PathManager from './path-manager';

export async function collectData(slug: string, newContent: string) {
    try {
        const dataPath = PathManager.getDataPath();
        
        // Use dataPath directly as the root for training data, no nested 'training_dataset'
        // This ensures clean directory structure: data/[slug]/[initial.md, history.jsonl]
        const trainingDir = dataPath; 
        
        // Ensure base training dir exists (dataPath should already exist via PathManager, but safe to check)
        if (!fs.existsSync(trainingDir)) {
            fs.mkdirSync(trainingDir, { recursive: true });
        }

        // slug is assumed to be safe already or we clean it again just in case
        const safeSlug = slug.replace(/[^a-zA-Z0-9\-\u4e00-\u9fa5\s_.\(\)]/g, '');
        const docDir = path.join(trainingDir, safeSlug);

        // Ensure doc dir exists
        if (!fs.existsSync(docDir)) {
            fs.mkdirSync(docDir, { recursive: true });
        }

        const initialFile = path.join(docDir, 'initial.md');
        const historyFile = path.join(docDir, 'history.jsonl');

        // Handle Initial Document
        if (!fs.existsSync(initialFile)) {
            // Try to find original file to use as baseline
            const inputDir = PathManager.getInputPath();
            const filename = safeSlug.endsWith('.md') ? safeSlug : `${safeSlug}.md`;
            const sourcePath = path.join(inputDir, filename);

            let initialContent = newContent; // Default to new content if source doesn't exist (new file)
            
            if (fs.existsSync(sourcePath)) {
                initialContent = fs.readFileSync(sourcePath, 'utf8');
            }
            
            fs.writeFileSync(initialFile, initialContent, 'utf8');
        }

        // Handle History (Incremental Save)
        const historyEntry = {
            timestamp: Date.now(),
            content: newContent
        };

        fs.appendFileSync(historyFile, JSON.stringify(historyEntry) + '\n', 'utf8');
        console.log(`[DataCollector] Collected data for ${safeSlug}`);
        
    } catch (error) {
        console.error('[DataCollector] Failed to collect data:', error);
        // Don't throw, so we don't block the main save operation
    }
}
