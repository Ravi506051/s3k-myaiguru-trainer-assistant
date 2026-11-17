"""Render the case-study markdown as a submission-ready PDF with its UI screenshot."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "video_tools"))
import markdown

source = (ROOT / "assessment.md").read_text(encoding="utf-8")
body = markdown.markdown(source, extensions=["tables", "fenced_code", "sane_lists"])
html = f"""<!doctype html><html lang='en'><head><meta charset='utf-8'><title>S3K Case Study 01 — Ravi Kumar Rao</title><style>
@page {{ size:A4; margin:17mm 16mm 17mm 16mm; }}
* {{ box-sizing:border-box; }} body {{ font:10.3pt/1.52 Arial,sans-serif; color:#263448; margin:0; }}
h1,h2,h3 {{ font-family:Arial,sans-serif; color:#233a58; page-break-after:avoid; }}
h1 {{ font-size:23pt; line-height:1.15; padding-bottom:10mm; border-bottom:3px solid #486c98; margin:0 0 10mm; }}
h2 {{ font-size:15pt; margin:9mm 0 3mm; border-bottom:1px solid #dce4ec; padding-bottom:2mm; }}
h3 {{ font-size:11.5pt; margin:6mm 0 2mm; }}
p {{ margin:0 0 3.2mm; }} li {{ margin-bottom:1.5mm; }} ul,ol {{ padding-left:6mm; }}
table {{ width:100%; border-collapse:collapse; margin:4mm 0 6mm; font-size:8.5pt; page-break-inside:avoid; }}
th,td {{ border:1px solid #dce4ec; padding:2mm 2.4mm; vertical-align:top; }}
th {{ background:#eaf0f6; color:#264566; text-align:left; }} tr:nth-child(even) td {{ background:#fafbfd; }}
img {{ max-width:100%; border:1px solid #dce4ec; border-radius:5px; margin:3mm 0 5mm; }}
code {{ font:9pt Consolas,monospace; background:#edf2f7; padding:1px 3px; overflow-wrap:anywhere; }}
a {{ color:#315b8b; overflow-wrap:anywhere; }} blockquote {{ border-left:3px solid #8fa9c3; margin:4mm 0; padding-left:4mm; }}
</style></head><body>{body}</body></html>"""
(ROOT / "S3K_Ravi_Kumar_Rao_Case_Study_01.html").write_text(html, encoding="utf-8")
print(ROOT / "S3K_Ravi_Kumar_Rao_Case_Study_01.html")
