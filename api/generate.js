export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { keyword, styles, length, target, tone, extra } = req.body;
    const lengthGuide = { short: '600~800자', medium: '1000~1400자', long: '1800~2200자' }[length] || '1000~1400자';

    const systemPrompt = `당신은 네이버 블로그 상품 소개글 전문 작성자입니다.
글쓰기 원칙:
- 실제 사람이 쓴 것처럼 자연스럽게
- 말투: ${tone}
- ~해요, ~했죠, ~이죠, ~인데요, ~더라고요 등 구어체 골고루
- 대놓고 홍보 금지. 독자가 자연스럽게 필요를 느끼게
- 경험담처럼 쓰되 신뢰감 있게
- 소제목은 이모지 포함해서 생동감 있게
- 글 길이: 본문 ${lengthGuide} 내외

응답 형식:
제목: [클릭하고 싶은 제목]

[본문 내용]

태그: #태그1 #태그2 #태그3 #태그4 #태그5 #태그6 #태그7`;

    const userPrompt = `상품 키워드: ${keyword}
글 스타일: ${styles}
독자 대상: ${target}
${extra ? '추가 요청: ' + extra : ''}
위 조건으로 네이버 블로그 상품 소개글을 써주세요.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'API 오류' });

    const text = data.content?.map(c => c.text || '').join('') || '';
    res.status(200).json({ result: text });

  } catch (err) {
    res.status(500).json({ error: '서버 오류가 발생했어요.' });
  }
}
