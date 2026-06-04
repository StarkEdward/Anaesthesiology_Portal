import sys
import re

def main():
    path = 'src/components/NMCFormB.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Reduce bottom margin on tables from mb-8/mb-6/mb-4 to mb-2
    # Be careful to only replace inside <table
    content = re.sub(r'(<table[^>]+className="[^"]*)mb-8([^"]*">)', r'\1mb-2\2', content)
    content = re.sub(r'(<table[^>]+className="[^"]*)mb-6([^"]*">)', r'\1mb-2\2', content)
    content = re.sub(r'(<table[^>]+className="[^"]*)mb-4([^"]*">)', r'\1mb-2\2', content)
    
    # 2. Reduce bottom margin on no-print elements from mb-8/mb-4 to mb-2
    content = re.sub(r'(className="no-print[^"]*)mb-8([^"]*")', r'\1mb-2\2', content)
    content = re.sub(r'(className="no-print[^"]*)mb-4([^"]*")', r'\1mb-2\2', content)
    content = re.sub(r'(className="no-print[^"]*)mt-2([^"]*")', r'\1mt-1\2', content)
    
    # 3. Some `<p>` tags between sections have `mb-2`, we can leave them or change to `mb-1`
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    main()
