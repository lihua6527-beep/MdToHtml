import random
from typing import List, Tuple

class SyntheticDataGenerator:
    def __init__(self):
        self.sentences = [
            "系统的响应速度很快", "界面设计非常美观", "用户体验流畅", 
            "数据库连接稳定", "安全性得到了保障", "代码结构清晰",
            "功能模块解耦", "测试覆盖率高", "文档齐全",
            "部署流程自动化", "维护成本低", "扩展性强"
        ]
        
        self.parallel_connectors = ["此外，", "另外，", "同时，", "并且，", ""]
        self.total_part_starters = ["主要包含以下几个方面：", "原因如下：", "总结为三点：", "具体表现为："]
        self.progressive_connectors = ["导致", "从而引发", "进而", "最终造成", "因为", "所以"]

    def generate_parallel(self, count: int) -> List[str]:
        data = []
        for _ in range(count):
            num_sents = random.randint(2, 4)
            sents = random.sample(self.sentences, num_sents)
            text = ""
            for i, s in enumerate(sents):
                conn = random.choice(self.parallel_connectors) if i > 0 else ""
                text += conn + s + "。"
            data.append(text)
        return data

    def generate_total_part(self, count: int) -> List[str]:
        data = []
        for _ in range(count):
            head = random.choice(self.total_part_starters)
            num_sents = random.randint(2, 3)
            sents = random.sample(self.sentences, num_sents)
            body = ""
            for i, s in enumerate(sents):
                prefix = f"第{i+1}，" if random.random() > 0.5 else "首先，" if i==0 else "其次，"
                body += prefix + s + "。"
            data.append(head + body)
        return data

    def generate_progressive(self, count: int) -> List[str]:
        data = []
        for _ in range(count):
            sents = random.sample(self.sentences, 2)
            conn = random.choice(self.progressive_connectors)
            
            if conn in ["因为", "由于"]:
                text = f"{conn}{sents[0]}，所以{sents[1]}。"
            else:
                text = f"{sents[0]}，{conn}{sents[1]}。"
            data.append(text)
        return data

    def generate_dataset(self, total_samples: int = 1000) -> List[Tuple[str, int]]:
        """
        0: Parallel
        1: Total-Part
        2: Progressive
        """
        samples_per_class = total_samples // 3
        dataset = []
        
        parallels = self.generate_parallel(samples_per_class)
        dataset.extend([(t, 0) for t in parallels])
        
        total_parts = self.generate_total_part(samples_per_class)
        dataset.extend([(t, 1) for t in total_parts])
        
        progressives = self.generate_progressive(samples_per_class)
        dataset.extend([(t, 2) for t in progressives])
        
        random.shuffle(dataset)
        return dataset
