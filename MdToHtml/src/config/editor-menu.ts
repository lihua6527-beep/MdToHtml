import { 
  LayoutTemplate, 
  Heading1, 
  Heading2, 
  Heading3, 
  Quote, 
  AlertTriangle, 
  Code,
  BarChart3,
  Columns
} from 'lucide-react';

export const EDITOR_MENU_ITEMS = [
  { label: '一级标题 (H1)', id: 'h1', icon: Heading1, text: '# ' },
  { label: '二级标题 (H2)', id: 'h2', icon: Heading2, text: '## ' },
  { label: '三级卡片 (Card)', id: 'card', icon: Heading3, text: '### Card Title\nContent here...' },
  { label: '统计数据 (Stat)', id: 'stat', icon: BarChart3, text: '### Metric {card-style="stat"}\n99.9%' },
  { label: '高亮内容 (Highlight)', id: 'highlight', icon: LayoutTemplate, text: '### Highlight {card-style="highlight"}\nImportant content.' },
  { label: '引用语 (Quote)', id: 'quote', icon: Quote, text: '### Quote {card-style="quote"}\n"This is a quote."' },
  { label: '警告提示 (Warning)', id: 'warning', icon: AlertTriangle, text: '### Warning {card-style="warning"}\nBe careful!' },
  { label: '代码块 (Code)', id: 'code', icon: Code, text: '### Code {card-style="code"}\n```js\nconsole.log("Hello");\n```' },
  { label: '左右分栏 (Split)', id: 'split', icon: Columns, text: '## Split Layout {relation="parallel"}\n' },
];
