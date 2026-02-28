import React from 'react';
import { getPostSlugs, getPostBySlug } from '@/lib/posts';
import { ThemeScope } from '@/components/ThemeScope';
import InteractivePost from '@/components/InteractivePost';

export async function generateStaticParams() {
  const slugs = getPostSlugs();
  return slugs.flatMap((file) => {
    const slug = file.replace(/\.md$/i, '');
    // Return both raw and encoded slugs to satisfy Next.js static export checks
    // especially for Chinese characters where browser requests might be encoded
    return [
      { slug },
      { slug: encodeURIComponent(slug) }
    ];
  });
}

export default function Page({ params }: { params: { slug: string } }) {
  const { slug } = params;
  let content = '';
  let decodedSlug = slug;
  let status: string | null = null;
  let historyCount = 0;

  try {
    // Attempt to decode just in case, though raw slug should work
    decodedSlug = decodeURIComponent(slug);
    const post = getPostBySlug(decodedSlug);
    content = post.content;
    status = (post as any).status || null;
    historyCount = (post as any).historyCount || 0;
  } catch (e) {
    decodedSlug = decodeURIComponent(slug);
    content = `# 错误\n未找到文件: ${decodedSlug}\n\n原始标识: ${slug}`;
    status = null;
  }

  return (
    // [Mod] Use ThemeScope to apply the selected theme to this page ONLY
    // The Editor UI remains neutral (using default :root variables)
    <ThemeScope className="min-h-screen flex flex-col">
       <InteractivePost 
         initialContent={content} 
         slug={slug} 
         decodedSlug={decodedSlug} 
         initialStatus={status}
         historyCount={historyCount}
       />
    </ThemeScope>
  );
}
