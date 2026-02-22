import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import PathManager from '@/lib/path-manager';

// Use absolute path to ensure reliability across environments
const postsDirectory = PathManager.getInputPath();

export function getPostSlugs() {
  if (!fs.existsSync(postsDirectory)) {
    // Create directory if it doesn't exist to avoid errors
    try {
        fs.mkdirSync(postsDirectory, { recursive: true });
    } catch (e) {
        console.warn('Failed to create input directory:', e);
        return [];
    }
    return [];
  }
  
  // Return raw filenames. Next.js handles Unicode.
  return fs.readdirSync(postsDirectory).filter((file) => /\.md$/i.test(file));
}

export function getPostBySlug(slug: string) {
  const realSlug = slug.replace(/\.md$/i, '');
  const fullPath = path.join(postsDirectory, `${realSlug}.md`);
  
  if (!fs.existsSync(fullPath)) {
     // Case-insensitive fallback
     const dir = fs.readdirSync(postsDirectory);
     const match = dir.find(f => f.toLowerCase() === `${realSlug.toLowerCase()}.md`);
     if (match) {
         return { slug: realSlug, content: fs.readFileSync(path.join(postsDirectory, match), 'utf8') };
     }

     throw new Error(`File not found: ${fullPath}`);
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  return { slug: realSlug, content: fileContents };
}

export function getAllPosts() {
  const slugs = getPostSlugs();
  const posts = slugs.map((slug) => {
    const realSlug = slug.replace(/\.md$/i, '');
    const fullPath = path.join(postsDirectory, slug);
    let mtime = 0;
    let status: string | undefined;
    
    try {
        const stats = fs.statSync(fullPath);
        mtime = stats.mtimeMs;
        
        // Read frontmatter for status
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data } = matter(fileContents);
        status = data.status;
    } catch (e) {
        console.warn(`Failed to get stats/metadata for ${slug}`, e);
    }

    return { 
        slug: realSlug,
        mtime,
        status
    };
  });
  
  // Default server-side sort: mtime desc
  return posts.sort((a, b) => b.mtime - a.mtime);
}
