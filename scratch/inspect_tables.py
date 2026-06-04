import re

with open('src/components/NMCFormB.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Find all tables
matches = re.finditer(r'<table[^>]*className=\"([^\"]*)\"', text)
print("Tables with margin/custom width classes:")
for m in matches:
    classes = m.group(1)
    line_num = text.count('\n', 0, m.start()) + 1
    # Check if classes contain ml-, mx-, or custom width classes
    if 'ml-' in classes or 'mx-' in classes or 'w-[' in classes or 'w-full' not in classes:
        print(f"Line {line_num}: className=\"{classes}\"")
