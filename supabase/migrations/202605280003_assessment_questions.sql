CREATE TABLE public.assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cefr_level TEXT NOT NULL CHECK (cefr_level IN ('A1','A2','B1','B2','C1','C2')),
  difficulty_score INT NOT NULL CHECK (difficulty_score BETWEEN 1 AND 5),
  question TEXT NOT NULL,
  reference_answer TEXT NOT NULL,
  scene_description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.assessment_questions (cefr_level, difficulty_score, question, reference_answer, scene_description) VALUES
('A1', 1, 'What is your name?', 'My name is [name]. Nice to meet you.', '初次见面打招呼'),
('A1', 1, 'Where are you from?', 'I am from China. I live in Beijing.', '问家乡'),
('A2', 2, 'What do you usually do on weekends?', 'I usually go shopping or watch movies with my friends on weekends.', '周末活动'),
('A2', 2, 'Can you describe your daily routine?', 'I wake up at seven, have breakfast, and take the subway to work.', '日常作息'),
('B1', 3, 'Tell me about a memorable trip you have taken.', 'I went to Japan last year. The food and temples were amazing — completely different from China.', '旅行回忆'),
('B1', 3, 'What do you think about learning English? Is it important?', 'I think it is essential nowadays, especially for work and international communication.', '学英语的看法'),
('B2', 4, 'How has technology changed the way people communicate?', 'Technology has made communication much faster and more convenient, but I think it has also made relationships less personal in some ways.', '科技与沟通'),
('B2', 4, 'What are the main advantages and disadvantages of working from home?', 'Working from home gives you flexibility and saves commuting time, but it can be hard to separate work from personal life and stay focused.', '远程工作'),
('C1', 5, 'Do you think globalization has been beneficial for developing countries? Why or why not?', 'It is a double-edged sword. While globalization brings economic opportunities and technology transfer, it can also lead to cultural homogenization and economic dependency on wealthier nations.', '全球化讨论'),
('C1', 5, 'Some people argue that social media does more harm than good. What is your view?', 'I have mixed feelings about this. Social media connects people and amplifies important voices, but the algorithms tend to reinforce echo chambers and spread misinformation at an alarming rate.', '社交媒体辩论');

ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read assessment questions"
  ON public.assessment_questions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "anon users can read assessment questions"
  ON public.assessment_questions
  FOR SELECT
  TO anon
  USING (true);

GRANT SELECT ON public.assessment_questions TO authenticated;
