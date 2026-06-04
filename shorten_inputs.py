import sys
import re

def main():
    path = 'src/components/NMCFormB.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace specific fields with fixed widths instead of flex-1 to prevent them from taking the whole page
    
    # 1. Date of LoP
    content = re.sub(r'(<span className="border-b border-black )flex-1("><InlineInput value=\{genDetails.lopDate\})', r'\1w-64\2', content)
    # 2. Years since start
    content = re.sub(r'(<span className="border-b border-black )flex-1("><InlineInput value=\{genDetails.yearsSince\})', r'\1w-64\2', content)
    # 3. Name of HOD
    content = re.sub(r'(<span className="border-b border-black )flex-1("><InlineInput value=\{genDetails.hod\})', r'\1w-96\2', content)
    # 4. Number of PG Admissions
    content = re.sub(r'(<span className="border-b border-black )flex-1("><InlineInput value=\{genDetails.seats\})', r'\1w-32\2', content)
    # 5. Number of Increase of Admissions
    content = re.sub(r'(<span className="border-b border-black )flex-1("><InlineInput value=\{genDetails.increaseApplied\})', r'\1w-32\2', content)
    # 6. Total number of units
    content = re.sub(r'(<span className="border-b border-black )flex-1("><InlineInput value=\{genDetails.units\})', r'\1w-32\2', content)
    # 7. Number of beds
    content = re.sub(r'(<span className="border-b border-black )flex-1("><InlineInput value=\{genDetails.beds\})', r'\1w-32\2', content)
    # 8. Number of units with beds in each unit
    content = re.sub(r'(<span className="border-b border-black )flex-1("><InlineInput value=\{genDetails.numUnitsBeds)', r'\1w-96\2', content)
    # 9. Details of PG inspections
    content = re.sub(r'(<span className="border-b border-black )flex-1("><InlineInput value=\{genDetails.pgInspectionsText)', r'\1w-[500px]\2', content)
    
    # Let's also do "Details of the Examination:" at the bottom of the page
    # It currently is `border-b border-black w-64 flex-1 mr-8`
    content = re.sub(r'border-b border-black w-64 flex-1 mr-8', r'border-b border-black w-96 mr-8', content)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    main()
