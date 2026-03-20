import React from 'react';
import { Card } from './Card';
import { getAllIcons } from '../../lib/icon-manager';

// List of all available icons
const allIcons = getAllIcons().map(icon => icon.name);

const CardIconShowcase: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Card Icon Showcase</h1>
      <p className="mb-8">This page showcases all available icons for cards.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {allIcons.map((iconName, index) => (
          <Card
            key={index}
            title={iconName}
            content={`This card uses the ${iconName} icon`}
            attributes={{ icon: iconName, shape: 'rect' }}
          />
        ))}
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Icon Usage Example</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <pre className="text-sm">
{`### Card Title {icon="zap"}
Card content here...`}
          </pre>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Total Icons: {allIcons.length}</h2>
        <p>All icons are available for use in rectangular cards.</p>
      </div>
    </div>
  );
};

export default CardIconShowcase;
