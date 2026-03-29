import fetch from 'node-fetch';

const query = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      title
      content
    }
  }
`;

fetch('https://leetcode.com/graphql/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        operationName: 'questionData',
        query,
        variables: { titleSlug: 'two-sum' }
    })
}).then(res => res.json()).then(data => console.log(data?.data?.question?.content ? "Success: content found" : "Failed")).catch(console.error);
