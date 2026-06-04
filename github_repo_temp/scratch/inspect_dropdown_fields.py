import re

with open('src/components/NMCFormB.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's search for patterns in JSX where fields are rendered
# e.g., properties containing 'adequate', 'available', etc.
lines = text.split('\n')
for i, line in enumerate(lines):
    if any(keyword in line.lower() for keyword in ['adequate', 'available', 'yes', 'no']) and 'onChange' in line:
        # Check if it is an InlineInput
        if 'InlineInput' in line:
            print(f"Line {i+1}: {line.strip()}")
