

export const mockUser = {
  id: 'user-1',
  name: 'John Developer',
  email: 'john@example.com',
  isPro: true,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

export const mockItemTypes = [
  {
    id: 'type-1',
    name: 'snippet',
    icon: 'Code',
    color: '#3b82f6',
    isSystem: true,
    userId: null,
  },
  {
    id: 'type-2',
    name: 'prompt',
    icon: 'Sparkles',
    color: '#8b5cf6',
    isSystem: true,
    userId: null,
  },
  {
    id: 'type-3',
    name: 'command',
    icon: 'Terminal',
    color: '#f97316',
    isSystem: true,
    userId: null,
  },
  {
    id: 'type-4',
    name: 'note',
    icon: 'StickyNote',
    color: '#fde047',
    isSystem: true,
    userId: null,
  },
  {
    id: 'type-5',
    name: 'link',
    icon: 'Link',
    color: '#10b981',
    isSystem: true,
    userId: null,
  },
];

export const mockItems = [
  {
    id: 'item-1',
    title: 'React useState Hook',
    description: 'Basic usage of useState in React',
    contentType: 'text',
    content: `import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`,
    language: 'typescript',
    isFavorite: true,
    isPinned: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    userId: 'user-1',
    itemTypeId: 'type-1',
  },
  {
    id: 'item-2',
    title: 'Generate React Components',
    description: 'Prompt for generating React components',
    contentType: 'text',
    content: 'You are an expert React developer. Create a well-structured React component with TypeScript that includes proper state management, props interface, and responsive design. The component should follow React best practices and include proper TypeScript types.',
    isFavorite: false,
    isPinned: true,
    createdAt: '2024-01-16T11:30:00Z',
    updatedAt: '2024-01-16T11:30:00Z',
    userId: 'user-1',
    itemTypeId: 'type-2',
  },
  {
    id: 'item-3',
    title: 'Create Next.js App',
    description: 'Command to create a new Next.js application',
    contentType: 'text',
    content: 'npx create-next-app@latest my-app --typescript --tailwind --eslint --app',
    isFavorite: false,
    isPinned: false,
    createdAt: '2024-01-17T14:20:00Z',
    updatedAt: '2024-01-17T14:20:00Z',
    userId: 'user-1',
    itemTypeId: 'type-3',
  },
  {
    id: 'item-4',
    title: 'Project Architecture Notes',
    description: 'Notes about project architecture decisions',
    contentType: 'text',
    content: 'Key decisions:\n- Use Next.js 14 with App Router\n- Implement TypeScript for type safety\n- Use Tailwind CSS for styling\n- Structure components in feature-based folders\n- Implement proper error boundaries',
    isFavorite: true,
    isPinned: false,
    createdAt: '2024-01-18T09:15:00Z',
    updatedAt: '2024-01-18T09:15:00Z',
    userId: 'user-1',
    itemTypeId: 'type-4',
  },
  {
    id: 'item-5',
    title: 'React Documentation',
    description: 'Official React documentation',
    contentType: 'url',
    url: 'https://react.dev',
    isFavorite: false,
    isPinned: false,
    createdAt: '2024-01-19T16:45:00Z',
    updatedAt: '2024-01-19T16:45:00Z',
    userId: 'user-1',
    itemTypeId: 'type-5',
  },
];

export const mockCollections = [
  {
    id: 'collection-1',
    name: 'React Patterns',
    description: 'Common React patterns and best practices',
    isFavorite: true,
    defaultTypeId: 'type-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    userId: 'user-1',
  },
  {
    id: 'collection-2',
    name: 'AI Prompts',
    description: 'Useful AI prompts for development',
    isFavorite: false,
    defaultTypeId: 'type-2',
    createdAt: '2024-01-16T11:30:00Z',
    updatedAt: '2024-01-16T11:30:00Z',
    userId: 'user-1',
  },
  {
    id: 'collection-3',
    name: 'Terminal Commands',
    description: 'Frequently used terminal commands',
    isFavorite: false,
    defaultTypeId: 'type-3',
    createdAt: '2024-01-17T14:20:00Z',
    updatedAt: '2024-01-17T14:20:00Z',
    userId: 'user-1',
  },
  {
    id: 'collection-4',
    name: 'Project Notes',
    description: 'Important project documentation and notes',
    isFavorite: true,
    defaultTypeId: 'type-4',
    createdAt: '2024-01-18T09:15:00Z',
    updatedAt: '2024-01-18T09:15:00Z',
    userId: 'user-1',
  },
];

export const mockItemCollections = [
  {
    itemId: 'item-1',
    collectionId: 'collection-1',
    addedAt: '2024-01-15T10:00:00Z',
  },
  {
    itemId: 'item-2',
    collectionId: 'collection-2',
    addedAt: '2024-01-16T11:30:00Z',
  },
  {
    itemId: 'item-3',
    collectionId: 'collection-3',
    addedAt: '2024-01-17T14:20:00Z',
  },
  {
    itemId: 'item-4',
    collectionId: 'collection-4',
    addedAt: '2024-01-18T09:15:00Z',
  },
];