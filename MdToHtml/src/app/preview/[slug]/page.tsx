/**
 * Preview 页面 — 通用渲染页（支持临时文件和正式文件）
 * 
 * 使用方式：
 * - 临时文件：/preview/__temp__{fileName} → 从临时目录加载
 * - 正式文件：/preview/{slug} → 从 input/ 目录加载
 * 
 * 设计原则：
 * - 所有内容在服务端不可推断时，使用客户端加载
 * - 临时文件通过 API 加载内容
 * - 正式文件通过 getPostBySlug 直接读取
 */
import React from 'react';
import { notFound } from 'next/navigation';
import { ThemeScope } from '@/components/ThemeScope';
import PreviewClient from './PreviewClient';
import ServerTempFileManager from '@/lib/temp-file-manager';

interface PreviewPageProps {
  params: { slug: string };
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const { slug } = params;
  const decodedSlug = decodeURIComponent(slug);
  
  // 判断是否为临时文件
  const isTempFile = decodedSlug.startsWith('__temp__');
  
  if (isTempFile) {
    // 临时文件：由客户端通过 API 加载
    const tempFileName = decodedSlug.replace('__temp__', '');
    return (
      <ThemeScope className="min-h-screen flex flex-col">
        <PreviewClient 
          slug={decodedSlug}
          tempFileName={tempFileName}
          isTempFile={true}
        />
      </ThemeScope>
    );
  }
  
  // 正式文件：尝试在服务端直接读取
  try {
    const { getPostBySlug } = require('@/lib/posts');
    const post = getPostBySlug(decodedSlug);
    const content = post.content;
    
    return (
      <ThemeScope className="min-h-screen flex flex-col">
        <PreviewClient 
          slug={decodedSlug}
          initialContent={content}
          isTempFile={false}
        />
      </ThemeScope>
    );
  } catch (e) {
    // 服务端读取失败，尝试客户端加载
    return (
      <ThemeScope className="min-h-screen flex flex-col">
        <PreviewClient 
          slug={decodedSlug}
          isTempFile={false}
          loadFromServer={true}
        />
      </ThemeScope>
    );
  }
}