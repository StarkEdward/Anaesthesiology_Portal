export const designationHierarchy: Record<string, number> = {
  "Professor and Head": 1,
  "Associate Professor": 2,
  "Assistant Professor": 3,
  "Senior Resident": 4,
  "Junior Resident - 3": 5,
  "Junior Resident - 2": 6,
  "Junior Resident - 1": 7,
  "Junior Resident": 8,
};

export const nameHierarchy: Record<string, number> = {
  "rajesh": 1,
  "yogesh": 1,
  "prasad": 2,
  "sneha": 1,
  "gulabsing": 2,
  "minakshi": 3,
  "manoj": 4,
  "prachi": 10,
  "kalpesh": 11,
  "sachin": 12,
  "hanuman": 13,
  "anjali": 14,
  "akshita": 15,
  "shraddha": 16,
  "laxman": 17,
  "mrunal": 18
};

// Helper function to sort two doctors robustly using the hierarchies
export const sortDoctors = (a: any, b: any) => {
  const rankA = designationHierarchy[a.designation] || 99;
  const rankB = designationHierarchy[b.designation] || 99;
  if (rankA !== rankB) return rankA - rankB;
  
  const nameRankA = nameHierarchy[(a.first_name || '').toLowerCase()] || 99;
  const nameRankB = nameHierarchy[(b.first_name || '').toLowerCase()] || 99;
  if (nameRankA !== nameRankB) return nameRankA - nameRankB;

  return (a.first_name || '').localeCompare(b.first_name || '');
};
