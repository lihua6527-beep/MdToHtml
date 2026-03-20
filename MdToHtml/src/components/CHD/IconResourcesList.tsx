import React from 'react';
import { getAllIcons, getIconsByCategory } from '../../lib/icon-manager';
import { Card } from './Card';

const IconResourcesList: React.FC = () => {
  const allIcons = getAllIcons();
  
  // Group icons by category
  const categories = Array.from(new Set(allIcons.map(icon => icon.category || 'uncategorized')));
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">图标资源列表 (Icon Resources)</h1>
      <p className="mb-8">本页面展示所有可用的CHD协议图标资源，可直接在卡片中使用。</p>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">总览</h2>
        <div className="bg-bg-card border border-border-soft rounded-lg p-6">
          <p className="mb-2"><strong>总图标数:</strong> {allIcons.length}</p>
          <p className="mb-2"><strong>分类数:</strong> {categories.length}</p>
          <p>使用格式: <code className="bg-bg-muted px-2 py-1 rounded">{`### 卡片标题 {icon="图标名称"}`}</code></p>
        </div>
      </div>
      
      {categories.map(category => {
        const categoryIcons = getIconsByCategory(category);
        if (categoryIcons.length === 0) return null;
        
        return (
          <div key={category} className="mb-12">
            <h2 className="text-xl font-bold mb-4">{category.charAt(0).toUpperCase() + category.slice(1)}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categoryIcons.map((icon, index) => (
                <Card
                  key={index}
                  title={icon.name}
                  content={icon.description || ''}
                  attributes={{ icon: icon.name, 'card-style': 'normal' }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default IconResourcesList;