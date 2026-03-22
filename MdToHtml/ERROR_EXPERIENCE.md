# 项目错误经验与核心文档

## 1. 核心问题分析

### 1.1 分区选择问题
**问题现象**：点击分区时显示选中框，但修改总是作用于第一个分区

**根本原因**：
- InteractivePost组件中`useCHDSelection` hook的调用方式错误，传递的是`selectedBlockIndex`（block索引）而不是行号（`activeLine`）
- 当传递block索引时，hook会将其当作行号处理，导致找到错误的block
- 通常第一个分区的startLine是0或接近0的数字，所以当传递0作为block索引时，会错误地选中第一个分区

**解决方案**：
1. 在InteractivePost组件中添加`activeLine`状态，用于跟踪当前选中的行号
2. 修复`useCHDSelection`调用，将`selectedBlockIndex`改为`activeLine`
3. 添加`onCardClick`回调，设置点击卡片时的`activeLine`
4. 添加`onSelectSection`回调，设置点击分区时的`activeLine`和`selectedBlockIndex`
5. 在`onSelectSection`回调中同时更新`activeLine`和`selectedBlockIndex`，保持状态一致性

### 1.2 底部工具栏切换问题
**问题现象**：点击分区后底部工具栏没有自动切换到"布局"标签

**根本原因**：BottomToolbar组件的自动切换逻辑没有正确处理分区选择

**解决方案**：
- 修改BottomToolbar组件的useEffect逻辑，当选中分区时自动切换到"布局"标签
- 确保selectedSectionTitle正确显示当前选中的分区标题

### 1.3 代码错误问题
**问题现象**：
- useCHDSelection hook中的正则表达式错误（/^#++/）
- 变量重复定义问题

**解决方案**：
- 修复正则表达式，将`/^#++/`改为`/^#+\s+/`
- 删除重复代码，确保变量只定义一次

### 1.4 事件处理问题
**问题现象**：Section组件的点击事件被其他元素干扰

**解决方案**：
- 在Section组件的点击处理函数中添加`e.stopPropagation()`，确保点击事件不会被其他元素干扰

### 1.5 状态管理问题
**问题现象**：分区选择状态没有正确传递和同步

**解决方案**：
- 在`onSelectSection`回调中同时更新`activeLine`和`selectedBlockIndex`，确保选择状态的一致性
- 确保CHDRenderer组件正确传递`onSelectSection`回调给Section组件

## 2. 核心代码修改

### 2.1 InteractivePost组件修改
```typescript
// 添加activeLine状态
const [activeLine, setActiveLine] = useState<number | null>(null);

// 修复useCHDSelection调用
const { activeSectionProps, activeCardProps, selectedSectionTitle } = useCHDSelection(content, activeLine);

// 添加onCardClick和onSelectSection回调
<CHDRenderer 
  markdown={content}  
  editMode={isEditing}
  selectedBlockIndex={selectedBlockIndex}
  onSelectBlock={setSelectedBlockIndex}
  onCardClick={(line) => {
      setActiveLine(line);
  }}
  onSelectSection={(blockIndex, title, layoutProps) => {
      try {
          const blocks = parseCHDBlocks(content);
          if (blockIndex >= 0 && blockIndex < blocks.length) {
              const sectionBlock = blocks[blockIndex];
              if (sectionBlock && sectionBlock.type === 'section') {
                  setActiveLine(sectionBlock.startLine);
                  setSelectedBlockIndex(blockIndex);
              }
          }
      } catch (e) {
          console.warn('Failed to sync cursor to section', e);
      }
  }}
  // 其他props...
/>
```

### 2.2 BottomToolbar组件修改
```typescript
// 优化自动切换标签逻辑
useEffect(() => {
    // If a section is selected (selectedSectionTitle is present), switch to layout tab
    if (selectedSectionTitle) {
        setActiveTab('layout');
    }
    // If a block is selected but no section title, switch to card tab
    else if (selectedBlockIndex !== null) {
        setActiveTab('card');
    }
    // Default to theme tab
    else {
        setActiveTab('theme');
    }
}, [selectedBlockIndex, selectedSectionTitle]);
```

### 2.3 Section组件修改
```typescript
// 优化点击处理逻辑
<section 
  onClick={(e) => {
    // 阻止事件冒泡，确保section点击不会被其他元素干扰
    e.stopPropagation();
    
    if (editMode && blockIndex !== undefined && blockIndex !== -1 && (onSelectBlock || onSelectSection)) {
         console.log('[Section Click Action] Triggering selection with index:', blockIndex, 'Title:', title);
         // Priority 1: Use onSelectSection for better integration
         if (onSelectSection) {
             const cleanTitle = title.replace('## ', '').replace(/\{.*?\}/g, '').trim();
             console.log('[Section Click Action] Calling onSelectSection with:', blockIndex, cleanTitle);
             onSelectSection(blockIndex, cleanTitle, layoutProps);
         } 
         // Priority 2: Fallback to explicit block index selection
         else if (onSelectBlock) {
             onSelectBlock(blockIndex);
         }
      }
  }}
  // 其他props...
>
```

### 2.4 useCHDSelection hook修复
```typescript
// 修复正则表达式错误
const { props } = parseAttributes(titleLine.replace(/^#+\s+/, ''));

// 优化activeLine处理逻辑
// 找到包含activeLine的block
let currentBlock = blocks.find(b => activeLine >= b.startLine && activeLine <= b.endLine);

// 如果没有找到，尝试找到最接近的section
if (!currentBlock) {
    console.log('[useCHDSelection] No block found for activeLine:', activeLine);
    // 找到最后一个startLine小于等于activeLine的section
    const sections = blocks.filter(b => b.type === 'section');
    const closestSection = sections.reduce((prev, current) => {
      return (current.startLine <= activeLine && current.startLine > (prev?.startLine || -1)) ? current : prev;
    }, null);
    
    if (closestSection) {
      console.log('[useCHDSelection] Using closest section:', closestSection.title, 'startLine:', closestSection.startLine);
      currentBlock = closestSection;
    } else {
      // 没有找到任何section，保留当前选择
      return;
    }
}
```

## 3. 测试验证

### 3.1 测试步骤
1. 进入编辑页面并点击"开始编辑"
2. 点击不同的分区，观察底部工具栏是否显示正确的分区信息
3. 尝试修改不同分区的列数、颜色等属性，确认修改是否作用于正确的分区
4. 验证点击分区后是否自动切换到底部工具栏的"布局"标签
5. 测试点击卡片时是否正确选中卡片所在的分区

### 3.2 预期结果
- 点击任何分区时，底部工具栏应显示该分区的信息
- 点击分区后，底部工具栏应自动切换到"布局"标签
- 修改分区属性时，修改应作用于当前选中的分区，而不是第一个分区
- 点击卡片时，应正确选中卡片所在的分区

## 4. 经验总结

### 4.1 状态管理最佳实践
- 明确状态的含义和用途：`activeLine`用于跟踪行号，`selectedBlockIndex`用于跟踪block索引
- 保持状态同步：确保相关状态（如`activeLine`和`selectedBlockIndex`）保持同步
- 使用适当的状态传递方式：根据hook的预期参数类型传递正确的状态

### 4.2 事件处理最佳实践
- 合理使用事件阻止：在需要的地方使用`e.stopPropagation()`防止事件冒泡
- 确保事件回调正确设置状态：在事件处理函数中正确更新相关状态

### 4.3 代码质量最佳实践
- 避免正则表达式错误：确保正则表达式语法正确
- 避免变量重复定义：确保变量只定义一次
- 添加适当的错误处理：使用try-catch处理可能的错误
- 添加详细的日志：在关键位置添加日志，便于调试和问题定位

### 4.4 组件设计最佳实践
- 明确组件职责：每个组件应有明确的职责和功能
- 合理传递props：确保组件间props传递正确
- 优化用户体验：添加自动切换标签等用户友好的功能

## 5. 技术栈与依赖

### 5.1 前端技术栈
- React 18+ with Next.js 14
- TypeScript
- Tailwind CSS
- Lucide React (图标库)

### 5.2 核心依赖
- `react` - 前端框架
- `next` - React框架的服务端渲染
- `typescript` - 类型系统
- `tailwindcss` - CSS框架
- `lucide-react` - 图标库
- `gray-matter` - Markdown解析

## 6. 项目结构

```
MdToHtml/
├── electron/           # Electron相关代码
├── src/
│   ├── app/            # Next.js应用
│   │   ├── editor/     # 编辑器页面
│   │   └── page.tsx    # 首页
│   ├── components/     # 组件
│   │   ├── CHD/        # CHD相关组件
│   │   ├── Editor/     # 编辑器组件
│   │   └── ui/         # UI组件
│   ├── hooks/          # 自定义hooks
│   │   ├── useCHDSelection.ts   # 分区选择hook
│   │   ├── useDocumentState.ts  # 文档状态hook
│   │   └── useMarkdownInteraction.ts  # Markdown交互hook
│   ├── lib/            # 工具库
│   │   ├── chdParser.ts        # CHD解析器
│   │   └── attributeParser.ts   # 属性解析器
│   └── services/       # 服务
├── package.json        # 项目配置
└── ERROR_EXPERIENCE.md # 错误经验文档
```

## 7. 未来改进方向

1. **状态管理优化**：考虑使用Redux或 Zustand等状态管理库，进一步简化状态管理
2. **性能优化**：使用React.memo和useMemo等优化渲染性能
3. **测试覆盖**：添加更多的单元测试和集成测试
4. **文档完善**：进一步完善项目文档和API文档
5. **用户体验改进**：添加更多用户友好的功能，如拖拽排序、批量操作等

## 8. 结论

通过分析和解决这些问题，我们不仅修复了分区选择和修改的功能，还提高了代码质量和用户体验。这些经验对于未来的项目开发和维护具有重要的参考价值。

核心要点：
- 正确理解和使用状态管理
- 合理处理事件和回调
- 注意代码质量和错误处理
- 优化用户体验
- 保持代码的可维护性和可扩展性

通过不断学习和改进，我们可以构建更加稳定、高效和用户友好的应用。