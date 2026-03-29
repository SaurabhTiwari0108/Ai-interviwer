async function fetchAllProblems() {
  try {
    const response = await fetch('https://leetcode.com/api/problems/algorithms/');
    const data = await response.json();
    console.log(`Total problems: ${data.stat_status_pairs.length}`);
    const medium = data.stat_status_pairs.filter(p => p.difficulty.level === 2 && !p.paid_only);
    const hard = data.stat_status_pairs.filter(p => p.difficulty.level === 3 && !p.paid_only);
    
    console.log(`Free Medium: ${medium.length}, Free Hard: ${hard.length}`);
    
    const sampleMed = medium[0];
    console.log(`Sample Medium:\nTitle: ${sampleMed.stat.question__title}\nSlug: ${sampleMed.stat.question__title_slug}`);

  } catch(e) {
    console.error(e);
  }
}
fetchAllProblems();
