"""
归档/收尾/记录 自动化脚本

功能：当 AI 检测到用户输入"归档""收尾""记录"等指令时，配合完成：
  1. 将计划书从 plans/ 移入 docs/归档/计划书/
  2. 写入今日开发记录
  3. 更新开发记录索引

用法（由 archive_and_record.bat 调用）：
  python archive_and_record.py --plan "<计划书文件名>" --summary "<改动摘要>" --api-info "<API变更说明>" --index-info "<索引变更说明>"

示例：
  python archive_and_record.py --plan "07_XXX功能计划.md" --summary "完成了XXX功能的重构" --api-info "新增 /api/xxx 接口" --index-info "新增 xxx 模块"
"""

import os
import sys
import re
import shutil
import datetime
from pathlib import Path


# ============================================================
# 路径常量
# ============================================================
PROJECT_ROOT = Path(__file__).resolve().parent.parent
PLANS_DIR = PROJECT_ROOT / "plans"
ARCHIVE_DIR = PROJECT_ROOT / "docs" / "归档" / "计划书"
DEV_RECORDS_DIR = PROJECT_ROOT / "docs" / "开发记录" / "历史记录"
RECORDS_INDEX = PROJECT_ROOT / "docs" / "开发记录" / "开发记录索引.md"


def get_today_str() -> str:
    """返回 yyyy-MM-dd 格式的今天日期"""
    return datetime.date.today().strftime("%Y-%m-%d")


def get_record_filename() -> str:
    """生成今日开发记录文件名"""
    return datetime.date.today().strftime("%Y-%m-%d_开发记录.md")


def ensure_dirs():
    """确保所有目录存在"""
    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
    DEV_RECORDS_DIR.mkdir(parents=True, exist_ok=True)


def archive_plan(plan_name: str) -> bool:
    """
    将计划书从 plans/ 移入 docs/归档/计划书/
    返回是否成功
    """
    if not plan_name:
        print("[INFO] 未指定计划书，跳过归档")
        return True

    src = PLANS_DIR / plan_name
    # 如果传入了无后缀的简写，尝试补全
    if not src.exists():
        # 尝试模糊匹配
        candidates = list(PLANS_DIR.glob(f"*{plan_name}*"))
        if candidates:
            src = candidates[0]
        else:
            print(f"[WARN] 未找到计划书: {plan_name}，跳过归档")
            return False

    dst = ARCHIVE_DIR / src.name

    # 如果目标已存在，添加日期后缀
    if dst.exists():
        stem = dst.stem
        suffix = dst.suffix
        today = datetime.date.today().strftime("%Y%m%d")
        dst = ARCHIVE_DIR / f"{stem}_归档_{today}{suffix}"

    shutil.move(str(src), str(dst))
    print(f"[OK] 计划书已归档: {src.name} → {dst.name}")
    return True


def append_to_dev_record(summary: str, plan_name: str = "", api_info: str = "", index_info: str = ""):
    """
    在今日开发记录末尾追加内容
    """
    record_path = DEV_RECORDS_DIR / get_record_filename()
    today = get_today_str()

    # 构建要追加的块
    lines = []
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append(f"## 后续归档记录 ({datetime.datetime.now().strftime('%H:%M')})")
    lines.append("")

    if summary:
        lines.append(f"**改动摘要**: {summary}")
        lines.append("")

    if plan_name:
        lines.append(f"- **关联计划书**: `{plan_name}` → 已归档至 `docs/归档/计划书/`")
        lines.append("")

    if api_info:
        lines.append(f"- **接口手册更新**: {api_info}")
        lines.append("")

    if index_info:
        lines.append(f"- **系统索引更新**: {index_info}")
        lines.append("")

    lines.append(f"- **归档时间**: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("")

    text_to_append = "\n".join(lines)

    # 如果文件存在，追加；否则创建
    if record_path.exists():
        mode = "a"
        print(f"[OK] 追加到已有开发记录: {record_path.name}")
    else:
        mode = "w"
        header = f"# {today} 开发记录\n\n> **今日工作**: {summary}\n\n---\n"
        text_to_append = header + text_to_append
        print(f"[OK] 创建新开发记录: {record_path.name}")

    with open(str(record_path), mode, encoding="utf-8") as f:
        f.write(text_to_append)

    return True


def update_records_index(summary: str, plan_name: str = ""):
    """
    更新开发记录索引（在对应月份下添加条目）
    """
    if not RECORDS_INDEX.exists():
        print(f"[WARN] 未找到开发记录索引: {RECORDS_INDEX}")
        return False

    today = get_today_str()
    record_name = get_record_filename()
    month_header = datetime.date.today().strftime("%Y年%m月")

    # 构建条目文本
    entry_text = f"- [{today} 开发记录](历史记录/{record_name}) — **{summary}**"
    if plan_name:
        entry_text += f"（{plan_name}）"

    with open(str(RECORDS_INDEX), "r", encoding="utf-8") as f:
        content = f.read()

    # 在对应月份标题下方插入
    month_section = f"## {month_header}"
    if month_section in content:
        # 找到该月份区块，在第一个条目之前插入（保持逆序，新条目在最前）
        lines = content.split("\n")
        new_lines = []
        in_target_month = False
        inserted = False

        for i, line in enumerate(lines):
            if line.strip() == month_section:
                in_target_month = True
                new_lines.append(line)
                # 检查下一行是否已经是条目
                continue

            if in_target_month and not inserted:
                # 检查当前行是否是条目
                next_is_entry = bool(re.match(r'^- \[', line.strip()))
                if next_is_entry:
                    new_lines.append(entry_text)
                    new_lines.append(line)
                    inserted = True
                    continue
                elif line.strip() == "" or line.startswith("## "):
                    new_lines.append(entry_text)
                    new_lines.append(line)
                    inserted = True
                    continue

            new_lines.append(line)

        # 如果到末尾还没插入（空月份）
        if not inserted and in_target_month:
            new_lines.append(entry_text)

        content = "\n".join(new_lines)
    else:
        # 该月份还不存在，在文件末尾追加
        content += f"\n## {month_header}\n- {entry_text}\n"

    with open(str(RECORDS_INDEX), "w", encoding="utf-8") as f:
        f.write(content)

    print(f"[OK] 开发记录索引已更新")
    return True


def parse_args():
    """解析命令行参数"""
    import argparse

    parser = argparse.ArgumentParser(
        description="归档/收尾/记录 自动化工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument("--plan", type=str, default="", help="计划书文件名（如 07_XXX计划.md）")
    parser.add_argument("--summary", type=str, default="", help="改动摘要")
    parser.add_argument("--api-info", type=str, default="", help="API接口变更说明")
    parser.add_argument("--index-info", type=str, default="", help="系统索引变更说明")
    return parser.parse_args()


def main():
    args = parse_args()

    print("=" * 50)
    print("  归档/收尾/记录 自动化工具")
    print(f"  时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    print()

    ensure_dirs()

    # Step 1: 归档计划书
    if args.plan:
        print(">> 步骤1: 归档计划书")
        archive_plan(args.plan)
        print()

    # Step 2: 记录到今日开发记录
    if args.summary:
        print(">> 步骤2: 写入今日开发记录")
        append_to_dev_record(args.summary, args.plan, args.api_info, args.index_info)
        print()

    # Step 3: 更新开发记录索引
    if args.summary:
        print(">> 步骤3: 更新开发记录索引")
        update_records_index(args.summary, args.plan)
        print()

    print("=" * 50)
    print("  完成！请 AI 助手继续更新 API接口手册.md 和 PROJECT_SYSTEM_INDEX.md")
    print("=" * 50)


if __name__ == "__main__":
    main()