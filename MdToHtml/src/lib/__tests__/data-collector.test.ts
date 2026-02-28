import fs from 'fs';
import path from 'path';
import { collectData } from '../data-collector';
import PathManager from '../path-manager';

// Mock PathManager
jest.mock('../path-manager', () => ({
  getInputPath: jest.fn(),
  getDataPath: jest.fn(),
  __esModule: true,
  default: {
      getInputPath: jest.fn(),
      getDataPath: jest.fn()
  }
}));

describe('DataCollector', () => {
    const testRoot = path.join(__dirname, 'test_data_collection');
    const inputDir = path.join(testRoot, 'input');
    const dataDir = path.join(testRoot, 'data');

    beforeEach(() => {
        // Setup directories
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
        fs.mkdirSync(inputDir, { recursive: true });
        fs.mkdirSync(dataDir, { recursive: true });

        // Mock PathManager methods
        const mockPathManager = require('../path-manager').default;
        mockPathManager.getInputPath.mockReturnValue(inputDir);
        mockPathManager.getDataPath.mockReturnValue(dataDir);
    });

    afterEach(() => {
        // Cleanup
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
    });

    test('should create initial.md and history.jsonl for new file', async () => {
        const slug = 'new-file';
        const content = 'New Content';

        await collectData(slug, content);

        const safeSlug = 'new-file';
        // Now it's directly under dataDir
        const docDir = path.join(dataDir, safeSlug);
        
        expect(fs.existsSync(path.join(docDir, 'initial.md'))).toBe(true);
        expect(fs.readFileSync(path.join(docDir, 'initial.md'), 'utf8')).toBe(content);
        
        const history = fs.readFileSync(path.join(docDir, 'history.jsonl'), 'utf8');
        const entry = JSON.parse(history.trim());
        expect(entry.content).toBe(content);
    });

    test('should use existing file content for initial.md', async () => {
        const slug = 'existing-file';
        const originalContent = 'Original Content';
        const newContent = 'Updated Content';

        // Create original file
        fs.writeFileSync(path.join(inputDir, `${slug}.md`), originalContent);

        await collectData(slug, newContent);

        const docDir = path.join(dataDir, slug);
        
        // initial.md should be original content
        expect(fs.readFileSync(path.join(docDir, 'initial.md'), 'utf8')).toBe(originalContent);
        
        // history should be new content
        const history = fs.readFileSync(path.join(docDir, 'history.jsonl'), 'utf8');
        const entry = JSON.parse(history.trim());
        expect(entry.content).toBe(newContent);
    });

    test('should append to history for subsequent saves', async () => {
        const slug = 'append-test';
        const content1 = 'Content 1';
        const content2 = 'Content 2';

        await collectData(slug, content1);
        await collectData(slug, content2);

        const docDir = path.join(dataDir, slug);
        const history = fs.readFileSync(path.join(docDir, 'history.jsonl'), 'utf8').trim().split('\n');
        
        expect(history.length).toBe(2);
        expect(JSON.parse(history[0]).content).toBe(content1);
        expect(JSON.parse(history[1]).content).toBe(content2);
    });
});
