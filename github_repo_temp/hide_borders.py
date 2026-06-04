import sys
import re

def main():
    path = 'src/index.css'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    print_rule = """
    /* Hide input underlines in print mode */
    input.border-b.border-black,
    span.border-b.border-black,
    div.h-10.border-b.border-black {
      border-bottom-color: transparent !important;
    }
  }
"""
    # Find the closing brace of @media print
    # It looks like:
    #     .report-page-break {
    #       page-break-after: always;
    #       break-after: page;
    #     }
    #   }
    
    content = content.replace("    .report-page-break {\n      page-break-after: always;\n      break-after: page;\n    }\n  }", 
                             "    .report-page-break {\n      page-break-after: always;\n      break-after: page;\n    }\n" + print_rule)
                             
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    main()
