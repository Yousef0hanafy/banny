#!/usr/bin/env python3
"""Post-process report footers per docx skill toc.md:
1. Remove empty <w:pgNumType/> from document.xml (confuses WPS).
2. Patch footer PAGE fields with explicit format switches:
   - sectPr fmt="upperRoman" -> its footer gets  PAGE \\* ROMAN \\* MERGEFORMAT
   - sectPr fmt="decimal"    -> its footer gets  PAGE \\* arabic \\* MERGEFORMAT
Usage: python3 patch-report-footers.py <file.docx>
"""
import re
import shutil
import sys
import zipfile

path = sys.argv[1]
tmp = path + ".tmp"

with zipfile.ZipFile(path, "r") as zin:
    names = zin.namelist()
    data = {n: zin.read(n) for n in names}

doc = data["word/document.xml"].decode("utf-8")

# 1. strip empty pgNumType (no attributes)
before = doc.count("<w:pgNumType/>")
doc = doc.replace("<w:pgNumType/>", "")
print(f"removed empty pgNumType: {before}")

# 2. map sectPr fmt -> footerReference rIds
rels = data["word/_rels/document.xml.rels"].decode("utf-8")
rel_map = dict(re.findall(r'<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"', rels))
# also handle attribute order variation
for m in re.finditer(r'<Relationship\b[^>]*>', rels):
    tag = m.group(0)
    rid = re.search(r'Id="([^"]+)"', tag)
    tgt = re.search(r'Target="([^"]+)"', tag)
    if rid and tgt:
        rel_map[rid.group(1)] = tgt.group(1)

fmt_for_footer = {}  # footer filename -> 'roman' | 'arabic'
for sect in re.finditer(r"<w:sectPr\b.*?</w:sectPr>", doc, re.S):
    block = sect.group(0)
    fmt = None
    if 'w:fmt="upperRoman"' in block or 'w:fmt="lowerRoman"' in block:
        fmt = "roman"
    elif 'w:fmt="decimal"' in block:
        fmt = "arabic"
    if not fmt:
        continue
    for fr in re.finditer(r'<w:footerReference[^>]*r:id="([^"]+)"', block):
        target = rel_map.get(fr.group(1), "")
        fname = "word/" + target.lstrip("/") if not target.startswith("word/") else target
        if fname in data:
            fmt_for_footer[fname] = fmt

print("footer format map:", fmt_for_footer)

# 3. patch each mapped footer's PAGE instrText
for fname, fmt in fmt_for_footer.items():
    xml = data[fname].decode("utf-8")
    switch = "ROMAN" if fmt == "roman" else "arabic"
    new_xml, n = re.subn(
        r"(<w:instrText[^>]*>)\s*PAGE\s*(</w:instrText>)",
        r"\1 PAGE \\* " + switch + r" \\* MERGEFORMAT \2",
        xml,
    )
    if n:
        data[fname] = new_xml.encode("utf-8")
        print(f"patched {fname}: {n} PAGE field(s) -> \\* {switch}")
    else:
        print(f"WARNING: no bare PAGE field found in {fname}")

data["word/document.xml"] = doc.encode("utf-8")

with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
    for n in names:
        zout.writestr(n, data[n])
shutil.move(tmp, path)
print("OK: footers patched")
